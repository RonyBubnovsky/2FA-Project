import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';

// Mock dependencies
jest.mock('../../../lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve(true)),
}));

// We need to access the mocked function directly
const mockGetIronSession = jest.fn();

// Mock IronSession
jest.mock('iron-session', () => ({
  getIronSession: mockGetIronSession
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('new-hashed-password'),
  compare: jest.fn().mockImplementation((newPassword, oldPassword) => {
    // Mock implementation to simulate password comparison
    if (oldPassword === 'current-hashed-password' && newPassword === 'CurrentPassword123!') {
      return Promise.resolve(true);
    }
    if (oldPassword === 'history-password-1' && newPassword === 'HistoryPassword1!') {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
}));

// Import bcrypt
import bcrypt from 'bcryptjs';

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('change-password API', () => {
  // Mock user data
  const mockUser = {
    _id: 'user-123',
    email: 'test@example.com',
    password: 'current-hashed-password',
    passwordHistory: ['history-password-1', 'history-password-2', 'history-password-3'],
    twoFA: { enabled: false },
    trustedDevices: ['device1', 'device2'],
    save: jest.fn().mockResolvedValue(true),
  };

  const validChangeData = {
    currentPassword: 'CurrentPassword123!',
    newPassword: 'NewPassword123!',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset User model mock
    (User.findById as jest.Mock).mockReset();
    
    // Set default authenticated session mock
    mockGetIronSession.mockResolvedValue({
      userId: 'user-123',
      twoFAVerified: true,
      email: 'test@example.com'
    });
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/change-password').default;
    });
  });

  // Positive tests
  it('should change password with valid data', async () => {
    // Setup mock for valid user
    (User.findById as jest.Mock).mockResolvedValue({...mockUser});
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password was changed
    expect(User.findById).toHaveBeenCalledWith('user-123');
    expect(bcrypt.compare).toHaveBeenCalledWith(validChangeData.currentPassword, mockUser.password);
    expect(bcrypt.hash).toHaveBeenCalledWith(validChangeData.newPassword, 10);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      success: true,
    });
  });

  it('should update password history when changing password', async () => {
    // Setup mock for valid user
    const userWithHistory = {...mockUser};
    (User.findById as jest.Mock).mockResolvedValue(userWithHistory);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    // Verify password history was updated
    expect(userWithHistory.passwordHistory).toContain('current-hashed-password');
    expect(userWithHistory.password).toBe('new-hashed-password');
    expect(res._getStatusCode()).toBe(200);
  });

  it('should revoke trusted devices when user has 2FA enabled', async () => {
    // Setup mock with 2FA enabled
    const userWith2FA = {
      ...mockUser,
      twoFA: { enabled: true },
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(userWith2FA);
    
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
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(userWithoutHistory);
    
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
      save: jest.fn().mockResolvedValue(true),
    };
    (User.findById as jest.Mock).mockResolvedValue(userWithFullHistory);
    
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
    
    // Make sure user would be found if we got that far
    (User.findById as jest.Mock).mockResolvedValue({...mockUser});
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData().error).toContain('must be logged in');
  });

  it('should reject when required fields are missing', async () => {
    // Make sure user would be found if we got that far
    (User.findById as jest.Mock).mockResolvedValue({...mockUser});
    
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
    // Setup mock for valid user
    (User.findById as jest.Mock).mockResolvedValue({...mockUser});
    
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
    // Setup mock for valid user
    (User.findById as jest.Mock).mockResolvedValue({...mockUser});
    
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
    // Setup mock for valid user
    (User.findById as jest.Mock).mockResolvedValue({...mockUser});
    
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
    (User.findById as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('POST', validChangeData);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData().error).toBe('User not found');
  });
}); 