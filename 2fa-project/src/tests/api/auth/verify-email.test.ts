import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import crypto from 'crypto';

// Use dynamic import to ensure mocks are applied
let handler: any;

describe('verify-email API', () => {
  const mockUser = {
    emailVerified: false,
    verificationToken: 'test-token',
    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    save: jest.fn().mockResolvedValue(undefined as any),
  };

  // Mock session
  const mockSession = {
    userId: 'mock-user-id',
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findOne as jest.Mock).mockReset();
    
    // Mock crypto functions
    jest.spyOn(crypto, 'createHash').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-token')
    } as any);
    
    jest.spyOn(crypto, 'createHmac').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hmac-hashed-token')
    } as any);
    
    jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);
    
    // Mock process.env
    process.env.HMAC_SECRET = 'test-hmac-secret';
    
    // Mock rate limiter
    jest.mock('rate-limiter-flexible', () => ({
      RateLimiterMemory: jest.fn().mockImplementation(() => ({
        consume: jest.fn().mockResolvedValue({}),
      })),
    }));
    
    // Mock uuid generation
    jest.mock('uuid', () => ({
      v4: jest.fn().mockReturnValue('mock-verification-token'),
    }));
    
    // Import handler inside beforeEach to use latest mocks
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/verify-email').default;
    });
  });

  // Positive tests
  it('should verify email with valid token', async () => {
    // Mock user find
    (User.findOne as jest.Mock).mockResolvedValue({
      ...mockUser,
      email: 'test@example.com',
      _id: 'mock-user-id'
    } as any);
    
    // Create request with valid token in body (now using POST)
    const req = createMockRequest('POST', { token: 'test-token' });
    req.session = { ...mockSession };
    const res = createMockResponse();
    
    // Call the handler
    await handler(req, res);
    
    // Verify results
    expect(User.findOne).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    expect(responseData.verificationSuccessToken).toBeDefined();
    expect(typeof responseData.verificationSuccessToken).toBe('string');
  });

  // Negative tests
  it('should reject invalid method', async () => {
    const req = createMockRequest('GET');
    req.session = { ...mockSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject missing token', async () => {
    const req = createMockRequest('POST', {});
    req.session = { ...mockSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Verification token is required' });
  });
  
  it('should reject when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null as any);
    
    const req = createMockRequest('POST', { token: 'invalid-token' });
    req.session = { ...mockSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid or expired verification token' });
  });
  
  it('should update session emailVerified flag when user is logged in', async () => {
    // Mock user find
    (User.findOne as jest.Mock).mockResolvedValue({
      ...mockUser,
      email: 'test@example.com',
      _id: 'mock-user-id'
    } as any);
    
    const req = createMockRequest('POST', { token: 'test-token' });
    req.session = { 
      userId: 'mock-user-id',
      save: jest.fn().mockResolvedValue(undefined) 
    };
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(req.session.emailVerified).toBe(true);
    expect(req.session.save).toHaveBeenCalled();
  });
  
  it('should handle rate limiting', async () => {
    // Mock rate limiting error directly in the handler
    jest.isolateModules(() => {
      // Import the module to be mocked
      const rateLimiter = require('rate-limiter-flexible');
      // Mock the RateLimiterMemory implementation
      rateLimiter.RateLimiterMemory = jest.fn().mockImplementation(() => ({
        consume: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
      }));
      
      // Re-import handler with the updated mocks
      handler = require('../../../pages/api/auth/verify-email').default;
    });
    
    const req = createMockRequest('POST', { token: 'test-token' });
    req.session = { ...mockSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toEqual({ error: 'Too many verification attempts. Please try again later.' });
  });
}); 