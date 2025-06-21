import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Mock dependencies
jest.mock('../../../lib/mail', () => ({
  transporter: {
    sendMail: jest.fn()
  }
}));

jest.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: jest.fn().mockImplementation(() => ({
    consume: jest.fn()
  }))
}));

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('Contact API', () => {
  const mockTransporter = {
    sendMail: jest.fn()
  };

  const mockRateLimiter = {
    consume: jest.fn()
  };

  // Valid contact form data
  const validContactData = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Test Subject',
    message: 'This is a test message that is longer than 10 characters'
  };
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockTransporter.sendMail.mockResolvedValue({});
    mockRateLimiter.consume.mockResolvedValue({});
    
    // Set up environment variables
    process.env.EMAIL_USER = 'admin@example.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    
    // Mock RateLimiterMemory constructor
    (RateLimiterMemory as jest.Mock).mockImplementation(() => mockRateLimiter);
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      const { transporter } = require('../../../lib/mail');
      transporter.sendMail = mockTransporter.sendMail;
      handler = require('../../../pages/api/auth/contact').default;
    });
  });

  // Success tests
  it('should send contact form successfully', async () => {
    const req = createMockRequest('POST', validContactData);
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify rate limiting was applied
    expect(mockRateLimiter.consume).toHaveBeenCalledWith('127.0.0.1');
    
    // Verify emails were sent (admin + confirmation)
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    
    // Verify admin email
    const adminEmailCall = mockTransporter.sendMail.mock.calls[0][0];
    expect(adminEmailCall.to).toBe('admin@example.com');
    expect(adminEmailCall.subject).toBe(`Contact Form: ${validContactData.subject}`);
    expect(adminEmailCall.replyTo).toBe(validContactData.email);
    expect(adminEmailCall.text).toContain(validContactData.name);
    expect(adminEmailCall.text).toContain(validContactData.message);
    
    // Verify confirmation email
    const confirmationEmailCall = mockTransporter.sendMail.mock.calls[1][0];
    expect(confirmationEmailCall.to).toBe(validContactData.email);
    expect(confirmationEmailCall.subject).toBe('Thank you for contacting 2FA App');
    expect(confirmationEmailCall.text).toContain(validContactData.name);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'Message sent successfully'
    });
  });

  // Method validation tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET', validContactData);
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ error: 'Method not allowed' });
  });

  // Rate limiting tests
  it('should handle rate limiting', async () => {
    // Mock rate limiter to throw error
    const rateLimiterError = {
      msBeforeNext: 1800000 // 30 minutes
    };
    mockRateLimiter.consume.mockRejectedValue(rateLimiterError);
    
    const req = createMockRequest('POST', validContactData);
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toEqual({
      error: 'Too many contact form submissions. Please try again later.',
      remainingTime: 1800
    });
    
    // Verify no emails were sent
    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  it('should handle rate limiting with default remaining time', async () => {
    // Mock rate limiter to throw error without msBeforeNext
    mockRateLimiter.consume.mockRejectedValue(new Error('Rate limit exceeded'));
    
    const req = createMockRequest('POST', validContactData);
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toEqual({
      error: 'Too many contact form submissions. Please try again later.',
      remainingTime: 3600
    });
  });

  // Field validation tests
  it('should reject missing required fields', async () => {
    const testCases = [
      { ...validContactData, name: '' },
      { ...validContactData, email: '' },
      { ...validContactData, subject: '' },
      { ...validContactData, message: '' },
      { ...validContactData, name: undefined },
      { ...validContactData, email: undefined },
      { ...validContactData, subject: undefined },
      { ...validContactData, message: undefined }
    ];

    for (const testData of testCases) {
      const req = createMockRequest('POST', testData);
      const res = createMockResponse();
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({ error: 'All fields are required' });
      
      // Reset mocks for next iteration
      jest.clearAllMocks();
      mockRateLimiter.consume.mockResolvedValue(true);
    }
  });

  it('should reject invalid email format', async () => {
    const invalidEmails = [
      'invalid-email',
      'invalid@',
      '@invalid.com',
      'invalid@invalid',
      'invalid.com',
      'invalid@.com',
      'invalid@com.'
    ];

    for (const email of invalidEmails) {
      const req = createMockRequest('POST', { ...validContactData, email });
      const res = createMockResponse();
      
      await handler(req, res);
      
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({ error: 'Invalid email format' });
      
      // Reset mocks for next iteration
      jest.clearAllMocks();
      mockRateLimiter.consume.mockResolvedValue(true);
    }
  });

  it('should reject message too short', async () => {
    const req = createMockRequest('POST', {
      ...validContactData,
      message: 'Short' // Less than 10 characters
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ 
      error: 'Message must be between 10 and 2000 characters' 
    });
  });

  it('should reject message too long', async () => {
    const req = createMockRequest('POST', {
      ...validContactData,
      message: 'A'.repeat(2001) // More than 2000 characters
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ 
      error: 'Message must be between 10 and 2000 characters' 
    });
  });

  // Email sending error tests
  it('should handle email sending errors', async () => {
    // Mock transporter to throw error
    mockTransporter.sendMail.mockRejectedValue(new Error('Email sending failed'));
    
    const req = createMockRequest('POST', validContactData);
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      error: 'Failed to send message. Please try again later.'
    });
  });

  // IP extraction tests
  it('should extract IP from x-forwarded-for header', async () => {
    const req = createMockRequest('POST', validContactData, {}, {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1'
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Should use first IP from x-forwarded-for
    expect(mockRateLimiter.consume).toHaveBeenCalledWith('192.168.1.1');
    expect(res._getStatusCode()).toBe(200);
  });

  it('should extract IP from x-real-ip header when x-forwarded-for is not present', async () => {
    const req = createMockRequest('POST', validContactData, {}, {
      'x-real-ip': '192.168.1.2'
    });
    // Remove x-forwarded-for header
    delete req.headers['x-forwarded-for'];
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(mockRateLimiter.consume).toHaveBeenCalledWith('192.168.1.2');
    expect(res._getStatusCode()).toBe(200);
  });

  it('should handle missing IP headers', async () => {
    const req = createMockRequest('POST', validContactData, {}, {});
    // Remove IP headers
    delete req.headers['x-forwarded-for'];
    delete req.headers['x-real-ip'];
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Should use 'unknown' as fallback
    expect(mockRateLimiter.consume).toHaveBeenCalledWith('unknown');
    expect(res._getStatusCode()).toBe(200);
  });

  // Edge cases
  it('should handle valid email with special characters', async () => {
    const req = createMockRequest('POST', {
      ...validContactData,
      email: 'test+tag@example-domain.co.uk'
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
  });

  it('should handle message at minimum length', async () => {
    const req = createMockRequest('POST', {
      ...validContactData,
      message: 'A'.repeat(10) // Exactly 10 characters
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
  });

  it('should handle message at maximum length', async () => {
    const req = createMockRequest('POST', {
      ...validContactData,
      message: 'A'.repeat(2000) // Exactly 2000 characters
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
  });

  it('should handle special characters in form fields', async () => {
    const specialData = {
      name: 'José María',
      email: 'jose@example.com',
      subject: 'Subject with émojis 🚀',
      message: 'Message with special chars: <script>alert("test")</script> & HTML entities'
    };
    
    const req = createMockRequest('POST', specialData);
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    
    // Verify special characters are preserved in emails
    const adminEmailCall = mockTransporter.sendMail.mock.calls[0][0];
    expect(adminEmailCall.text).toContain(specialData.name);
    expect(adminEmailCall.text).toContain(specialData.message);
  });
});
