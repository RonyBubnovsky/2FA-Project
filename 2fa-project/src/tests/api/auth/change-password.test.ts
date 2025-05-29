import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';

// Mock User model
const mockUserFindById = jest.fn();
jest.mock('../../../models/User', () => ({
  User: {
    findById: mockUserFindById
  }
}));

// Mock rate limiting functions
const mockIsRateLimited = jest.fn();
const mockResetRateLimit = jest.fn();
jest.mock('../../../utils/rateLimiting', () => ({
  isRateLimited: mockIsRateLimited,
  resetRateLimit: mockResetRateLimit,
  RATE_LIMIT_MAX: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000
}));

// Mock bcrypt
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();
jest.mock('bcryptjs', () => ({
  compare: mockBcryptCompare,
  hash: mockBcryptHash
}));

// Mock session
const mockGetIronSession = jest.fn();
jest.mock('iron-session', () => ({
  getIronSession: mockGetIronSession
}));

// Mock MongoDB connection
jest.mock('../../../lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

// Mock session options
jest.mock('../../../lib/session', () => ({
  sessionOptions: {
    cookieName: 'test-cookie',
    password: 'test-password-must-be-at-least-32-characters'
  }
}));

// Import the handler
import handler from '../../../pages/api/auth/change-password';

describe('change-password API', () => {
  // Set up mock user data
  const mockUser = {
    _id: 'user-123',
    email: 'test@example.com',
    password: 'current-hashed-password',
    passwordHistory: ['history-password-1', 'history-password-2', 'history-password-3'],
    twoFA: { enabled: false },
    trustedDevices: ['device1', 'device2'],
    save: jest.fn().mockResolvedValue(undefined)
  };

  const validChangeData = {
    currentPassword: 'CurrentPassword123!',
    newPassword: 'NewPassword123!'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUserFindById.mockResolvedValue({ ...mockUser, save: jest.fn().mockResolvedValue(undefined) });
    mockIsRateLimited.mockResolvedValue(false);
    mockResetRateLimit.mockResolvedValue(undefined);
    mockBcryptHash.mockResolvedValue('new-hashed-password');
    mockBcryptCompare.mockImplementation((password, hash) => {
      if (hash === 'current-hashed-password' && password === 'CurrentPassword123!') {
        return Promise.resolve(true);
      }
      if (hash === 'history-password-1' && password === 'HistoryPassword1!') {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });
    mockGetIronSession.mockResolvedValue({
      userId: 'user-123',
      twoFAVerified: true,
      email: 'test@example.com'
    });
  });

  // Positive tests
  it('should change password with valid data', async () => {
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify correct functions were called
    expect(mockUserFindById).toHaveBeenCalledWith('user-123');
    expect(mockBcryptCompare).toHaveBeenCalledWith(validChangeData.currentPassword, mockUser.password);
    expect(mockBcryptHash).toHaveBeenCalledWith(validChangeData.newPassword, 10);
    expect(mockIsRateLimited).toHaveBeenCalledWith('user-123', 'change-password');
    expect(mockResetRateLimit).toHaveBeenCalledWith('user-123', 'change-password');
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      success: true,
      message: 'Password changed successfully'
    });
  });

  it('should update password history when changing password', async () => {
    // Setup mock for valid user with its own copy to track changes
    const userWithHistory = {
      ...mockUser,
      save: jest.fn().mockResolvedValue(undefined)
    };
    mockUserFindById.mockResolvedValue(userWithHistory);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was updated
    expect(userWithHistory.passwordHistory).toContain('current-hashed-password');
    expect(userWithHistory.password).toBe('new-hashed-password');
    expect(userWithHistory.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should revoke trusted devices when user has 2FA enabled', async () => {
    // Setup mock with 2FA enabled
    const userWith2FA = {
      ...mockUser,
      twoFA: { enabled: true },
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockUserFindById.mockResolvedValue(userWith2FA);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify trusted devices were cleared
    expect(userWith2FA.trustedDevices).toEqual([]);
    expect(userWith2FA.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should initialize passwordHistory if it doesn\'t exist', async () => {
    // Setup mock with no password history
    const userWithoutHistory = {
      ...mockUser,
      passwordHistory: undefined,
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockUserFindById.mockResolvedValue(userWithoutHistory);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was created and updated
    expect(Array.isArray(userWithoutHistory.passwordHistory)).toBe(true);
    expect(userWithoutHistory.passwordHistory).toContain('current-hashed-password');
    expect(userWithoutHistory.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should limit password history to 5 entries', async () => {
    // Setup mock with already 5 entries in password history
    const userWithFullHistory = {
      ...mockUser,
      passwordHistory: ['p1', 'p2', 'p3', 'p4', 'p5'],
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockUserFindById.mockResolvedValue(userWithFullHistory);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was updated and limited to 5
    expect(userWithFullHistory.passwordHistory.length).toBe(5);
    expect(userWithFullHistory.passwordHistory).toContain('current-hashed-password');
    expect(userWithFullHistory.passwordHistory).not.toContain('p1'); // oldest should be removed
    expect(userWithFullHistory.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  // Rate limiting tests
  it('should reject requests that exceed rate limit', async () => {
    // Set up rate limiting mock to return true (user is rate limited)
    mockIsRateLimited.mockResolvedValue(true);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify rate limit check was called
    expect(mockIsRateLimited).toHaveBeenCalledWith('user-123', 'change-password');
    
    // Verify response indicates rate limiting
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData().error).toContain('Too many password change attempts');
  });

  // Negative tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData().error).toBe('Method not allowed');
  });

  it('should reject unauthenticated requests', async () => {
    // Setup unauthenticated session for this specific test
    mockGetIronSession.mockResolvedValueOnce({
      userId: undefined,
      twoFAVerified: false
    });
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData().error).toContain('must be logged in');
  });

  it('should reject when required fields are missing', async () => {
    const req = createMockRequest('POST', { currentPassword: 'CurrentPassword123!' }); // missing newPassword
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('required');
  });

  it('should reject weak password', async () => {
    const req = createMockRequest('POST', {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'weak',
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('Password must be at least 8 characters');
  });

  it('should reject when current password is incorrect', async () => {
    mockBcryptCompare.mockResolvedValueOnce(false); // Current password check fails

    const req = createMockRequest('POST', {
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword123!',
    });
    const res = createMockResponse();

    await handler(req, res);

    // Verify password change was rejected
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('Current password is incorrect');
  });

  it('should reject if new password is the same as current', async () => {
    // Mock bcrypt to simulate same password
    mockBcryptCompare
      .mockResolvedValueOnce(true)  // Current password check passes
      .mockResolvedValueOnce(true); // Same as current check also passes
    
    const req = createMockRequest('POST', {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'CurrentPassword123!',
    });
    const res = createMockResponse();

    await handler(req, res);

    // Verify password change was rejected
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('cannot be the same as your current password');
  });

  it('should reject if new password is in password history', async () => {
    const req = createMockRequest('POST', {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'HistoryPassword1!',
    });
    const res = createMockResponse();

    await handler(req, res);

    // Verify password change was rejected
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('cannot be the same as any of your last 5 passwords');
  });

  it('should handle user not found', async () => {
    // Setup mock for non-existent user
    mockUserFindById.mockResolvedValue(null);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData().error).toBe('User not found');
  });
}); 