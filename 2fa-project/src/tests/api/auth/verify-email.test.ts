import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import crypto from 'crypto';

// Use dynamic import to ensure mocks are applied
let handler: any;

describe('verify-email API', () => {
  const mockUser = {
    emailVerified: false,
    verificationToken: 'hashed-token',
    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    save: jest.fn().mockResolvedValue(undefined as any),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findOne as jest.Mock).mockReset();
    
    // Setup crypto mock
    jest.spyOn(crypto, 'createHmac').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-token')
    } as any);
    
    // Import handler inside beforeEach to use latest mocks
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/verify-email').default;
    });
  });

  // Positive tests
  it('should verify email with valid token', async () => {
    // Mock user find
    (User.findOne as jest.Mock).mockResolvedValue({...mockUser} as any);
    
    // Create request with valid token
    const req = createMockRequest('GET', {}, { token: 'valid-token' });
    const res = createMockResponse();
    
    // Call the handler
    await handler(req, res);
    
    // Verify results
    expect(User.findOne).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });

  // Negative tests
  it('should reject invalid method', async () => {
    const req = createMockRequest('POST');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
  });
  
  it('should reject missing token', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
  });
  
  it('should reject when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null as any);
    
    const req = createMockRequest('GET', {}, { token: 'invalid-token' });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid or expired token' });
  });
  
  it('should reject expired token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      ...mockUser,
      verificationTokenExpiry: new Date(Date.now() - 1000), // expired
    } as any);
    
    const req = createMockRequest('GET', {}, { token: 'expired-token' });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid or expired token' });
  });
  
  it('should handle rate limiting', async () => {
    // Mock rate limiting error directly in the handler
    // First set up a successful user find to reach the rate limiter code
    (User.findOne as jest.Mock).mockResolvedValue({...mockUser} as any);
    
    // Then mock the API handler itself to simulate rate limiting
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
    
    const req = createMockRequest('GET', {}, { token: 'valid-token' });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toEqual({ error: 'Too many attempts, try later.' });
  });
}); 