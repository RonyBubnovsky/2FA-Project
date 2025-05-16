import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import crypto from 'crypto';
import { User } from '../../../models/User';
import { sendPasswordResetEmail } from '../../../lib/mail';

// Mock for crypto
const mockCryptoHash = {
  update: jest.fn().mockReturnThis(),
  digest: jest.fn().mockReturnValue('hashed-token'),
};

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('forgot-password API', () => {
  // Mock user data
  const mockUser = {
    email: 'test@example.com',
    resetPasswordToken: null,
    resetPasswordExpires: null,
    save: jest.fn().mockResolvedValue(true as any),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment and mocks
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    
    // Reset User model mock
    (User.findOne as jest.Mock).mockReset();
    
    // Mock crypto
    jest.spyOn(crypto, 'createHash').mockReturnValue(mockCryptoHash as any);
    
    // Mock UUID
    jest.mock('uuid', () => ({
      v4: jest.fn().mockReturnValue('test-uuid'),
    }), { virtual: true });
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/forgot-password').default;
    });
  });

  // Positive tests
  it('should send reset email when email exists', async () => {
    // Setup mock to find a user
    (User.findOne as jest.Mock).mockResolvedValue({...mockUser} as any);
    
    const req = createMockRequest('POST', { email: 'test@example.com' });
    const res = createMockResponse();

    await handler(req, res);

    // Verify email was sent
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(mockUser.save).toHaveBeenCalled();
    
    // Check mail was sent
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining('test-uuid')
    );
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().success).toBe(true);
  });

  it('should return success even when email does not exist (security)', async () => {
    // Setup mock to not find a user
    (User.findOne as jest.Mock).mockResolvedValue(null as any);
    
    const req = createMockRequest('POST', { email: 'nonexistent@example.com' });
    const res = createMockResponse();

    await handler(req, res);

    // Verify behavior for non-existent user
    expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    
    // Verify email was not sent
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    
    // Should still return 200 success for security reasons
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().success).toBe(true);
  });

  // Negative tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should reject when email is missing', async () => {
    const req = createMockRequest('POST', {});
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Email is required' });
  });

  it('should handle email sending errors', async () => {
    // Setup mock to find a user
    (User.findOne as jest.Mock).mockResolvedValue({
      ...mockUser,
      save: jest.fn().mockResolvedValue(true as any),
    } as any);
    
    // Mock email sending error
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(new Error('Email sending failed') as any);
    
    const req = createMockRequest('POST', { email: 'test@example.com' });
    const res = createMockResponse();

    await handler(req, res);

    // Verify error handling
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(sendPasswordResetEmail).toHaveBeenCalled();
    
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData().error).toBe('Failed to send reset email');
  });
}); 