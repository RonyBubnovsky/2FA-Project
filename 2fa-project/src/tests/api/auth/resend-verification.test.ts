import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import crypto from 'crypto';
import * as mailModule from '../../../lib/mail';

// Use dynamic import to ensure mocks are applied
let handler: any;

describe('resend-verification API', () => {
  // Mock user data
  const mockUser = {
    _id: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: false,
    save: jest.fn().mockResolvedValue(undefined),
  };

  // Mock session with authenticated user
  const mockAuthenticatedSession = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    save: jest.fn().mockResolvedValue(undefined),
  };

  // Mock session without user ID (unauthenticated)
  const mockUnauthenticatedSession = {
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    (User.findById as jest.Mock).mockReset();
    
    // Mock crypto.randomBytes
    jest.spyOn(crypto, 'randomBytes').mockImplementation(() => ({
      toString: jest.fn().mockReturnValue('mock-verification-token'),
    } as any));
    
    // Mock crypto.createHmac
    jest.spyOn(crypto, 'createHmac').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-verification-token'),
    } as any);
    
    // Mock process.env
    process.env.HMAC_SECRET = 'test-hmac-secret';
    
    // Mock sendVerificationEmail
    jest.spyOn(mailModule, 'sendVerificationEmail')
      .mockImplementation(() => Promise.resolve());
    
    // Import handler with fresh mocks
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/resend-verification').default;
    });
  });

  // Success test
  it('should successfully resend verification email', async () => {
    // Mock user finding
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Create request with authenticated session
    const req = createMockRequest('POST');
    req.session = { ...mockAuthenticatedSession };
    const res = createMockResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify results
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    // Verify token is hashed before storage
    expect(mockUser.verificationToken).toBe('hashed-verification-token');
    expect(mockUser.verificationTokenExpiry).toBeDefined();
    expect(mockUser.save).toHaveBeenCalled();
    // But original unhashed token is sent in email
    expect(mailModule.sendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com', 
      'mock-verification-token'
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ success: true });
  });

  // Error tests
  it('should reject invalid method', async () => {
    const req = createMockRequest('GET');
    req.session = { ...mockAuthenticatedSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject unauthenticated request', async () => {
    const req = createMockRequest('POST');
    req.session = { ...mockUnauthenticatedSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({
      error: 'You must be logged in to resend a verification email'
    });
  });
  
  it('should handle user not found', async () => {
    // Mock user not found
    (User.findById as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('POST');
    req.session = { ...mockAuthenticatedSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'User not found' });
  });
  
  it('should reject if email already verified', async () => {
    // Mock user with verified email
    (User.findById as jest.Mock).mockResolvedValue({
      ...mockUser,
      emailVerified: true
    });
    
    const req = createMockRequest('POST');
    req.session = { ...mockAuthenticatedSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Email is already verified' });
  });
  
  it('should handle email sending error', async () => {
    // Mock user
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock email sending error
    jest.spyOn(mailModule, 'sendVerificationEmail')
      .mockRejectedValue(new Error('Failed to send email'));
    
    // Create request
    const req = createMockRequest('POST');
    req.session = { ...mockAuthenticatedSession };
    const res = createMockResponse();
    
    // Call handler
    await handler(req, res);
    
    // Verify results
    expect(mockUser.save).toHaveBeenCalled(); // User should be saved with new token
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Failed to send verification email' });
  });

  it('should enforce rate limiting', async () => {
    // Mock rate limiting error
    jest.isolateModules(() => {
      // Import the module to be mocked
      const rateLimiter = require('rate-limiter-flexible');
      // Mock the RateLimiterMemory implementation
      rateLimiter.RateLimiterMemory = jest.fn().mockImplementation(() => ({
        consume: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
      }));
      
      // Re-import handler with the updated mocks
      handler = require('../../../pages/api/auth/resend-verification').default;
    });
    
    const req = createMockRequest('POST');
    req.session = { ...mockAuthenticatedSession };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toEqual({ 
      error: 'Too many verification attempts. Please try again later.' 
    });
  });
}); 