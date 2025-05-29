import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import crypto from 'crypto';
import { User } from '../../../models/User';

// Mock bcrypt module globally
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('new-hashed-password'),
  compare: jest.fn().mockImplementation((newPassword, oldPassword) => {
    // Mock implementation to simulate password comparison
    if (oldPassword === 'old-hashed-password' && newPassword === 'SamePassword123!') {
      return Promise.resolve(true);
    }
    if (oldPassword === 'history-password-1' && newPassword === 'HistoryPassword1!') {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
}));

// Get the mocked version
import bcrypt from 'bcryptjs';

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('reset-password API', () => {
  // Mock crypto hash
  const mockCryptoHash = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed-token'),
  };
  
  // Mock user data with password history
  const mockUser = {
    password: 'old-hashed-password',
    resetPasswordToken: 'hashed-token',
    resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour in the future
    twoFA: { enabled: false },
    trustedDevices: ['device1', 'device2'],
    passwordHistory: ['history-password-1', 'history-password-2', 'history-password-3'],
    save: jest.fn().mockResolvedValue(true as any),
  };
  
  const validResetData = {
    email: 'test@example.com',
    token: 'valid-token',
    password: 'NewPassword123!',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset User model mock
    (User.findOne as jest.Mock).mockReset();
    
    // Mock crypto
    jest.spyOn(crypto, 'createHash').mockReturnValue(mockCryptoHash as any);
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/reset-password').default;
    });
  });

  // Positive tests
  it('should reset password with valid token and password', async () => {
    // Setup mock for valid token
    (User.findOne as jest.Mock).mockResolvedValue({...mockUser} as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password was reset
    expect(User.findOne).toHaveBeenCalledWith({
      email: validResetData.email,
      resetPasswordToken: 'hashed-token',
      resetPasswordExpires: { $gt: expect.any(Number) },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(validResetData.password, 10);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      success: true,
    });
  });

  it('should update password history when resetting password', async () => {
    // Setup mock for valid token
    const userWithHistory = {...mockUser};
    (User.findOne as jest.Mock).mockResolvedValue(userWithHistory as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was updated
    expect(userWithHistory.passwordHistory).toContain('old-hashed-password');
    expect(userWithHistory.password).toBe('new-hashed-password');
    expect(res._getStatusCode()).toBe(200);
  });

  it('should reject if new password is the same as current password', async () => {
    // Setup mock for valid token
    (User.findOne as jest.Mock).mockResolvedValue({...mockUser} as any);
    
    const req = createMockRequest('POST', {
      ...validResetData,
      password: 'SamePassword123!', // This will match with the current password in our mock
    });
    const res = createMockResponse();

    await handler(req, res);

    // Verify password change was rejected
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('cannot be the same as your current password');
  });

  it('should reject if new password is in password history', async () => {
    // Setup mock for valid token
    (User.findOne as jest.Mock).mockResolvedValue({...mockUser} as any);
    
    const req = createMockRequest('POST', {
      ...validResetData,
      password: 'HistoryPassword1!', // This will match with a password in history
    });
    const res = createMockResponse();

    await handler(req, res);

    // Verify password change was rejected
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('cannot be the same as any of your last 5 passwords');
  });

  it('should clear trusted devices when user has 2FA enabled', async () => {
    // Setup mock with 2FA enabled
    const userWith2FA = {
      ...mockUser,
      twoFA: { enabled: true },
      save: jest.fn().mockResolvedValue(true as any),
    };
    (User.findOne as jest.Mock).mockResolvedValue(userWith2FA as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    expect(userWith2FA.trustedDevices).toEqual([]);
    expect(userWith2FA.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should initialize passwordHistory if it doesn\'t exist', async () => {
    // Setup mock with no password history
    const userWithoutHistory = {
      ...mockUser,
      passwordHistory: undefined,
      save: jest.fn().mockResolvedValue(true as any),
    };
    (User.findOne as jest.Mock).mockResolvedValue(userWithoutHistory as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was created and updated
    expect(Array.isArray(userWithoutHistory.passwordHistory)).toBe(true);
    expect(userWithoutHistory.passwordHistory).toContain('old-hashed-password');
    expect(userWithoutHistory.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should limit password history to 5 entries', async () => {
    // Setup mock with already 5 entries in password history
    const userWithFullHistory = {
      ...mockUser,
      passwordHistory: ['p1', 'p2', 'p3', 'p4', 'p5'],
      save: jest.fn().mockResolvedValue(true as any),
    };
    (User.findOne as jest.Mock).mockResolvedValue(userWithFullHistory as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was updated and limited to 5
    expect(userWithFullHistory.passwordHistory.length).toBe(5);
    expect(userWithFullHistory.passwordHistory).toContain('old-hashed-password');
    expect(userWithFullHistory.passwordHistory).not.toContain('p1'); // oldest should be removed
    expect(userWithFullHistory.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  // Negative tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should reject when fields are missing', async () => {
    // Test with missing password
    const req = createMockRequest('POST', {
      email: 'test@example.com',
      token: 'valid-token',
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Missing required fields' });
  });

  it('should reject weak password', async () => {
    const req = createMockRequest('POST', {
      ...validResetData,
      password: 'weak',
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('Password must be at least 8 characters');
  });

  it('should reject when token is invalid', async () => {
    // Setup mock for invalid/non-existent token
    (User.findOne as jest.Mock).mockResolvedValue(null as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    expect(User.findOne).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid or expired reset token' });
  });

  it('should reject when token has expired', async () => {
    // Create a custom date that's definitely in the past
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 3); // 3 hours in the past
    
    // Mock findOne to return null - handler will interpret this as expired/invalid token
    (User.findOne as jest.Mock).mockResolvedValue(null as any);
    
    const req = createMockRequest('POST', validResetData);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid or expired reset token' });
  });
}); 