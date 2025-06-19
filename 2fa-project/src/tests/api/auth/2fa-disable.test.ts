import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import speakeasy from 'speakeasy';

// Mock dependencies
jest.mock('speakeasy', () => ({
  totp: {
    verify: jest.fn()
  }
}));

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('2FA disable API', () => {
  // Mock session data
  const mockSession = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    twoFAVerified: true,
    save: jest.fn().mockResolvedValue(undefined)
  };
  
  // Create mock users with different 2FA states
  const createUserWith2FAEnabled = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: {
        enabled: true,
        secret: 'TESTSECRETBASE32',
        recoveryCodes: []
      },
      save: jest.fn().mockResolvedValue(true)
    };
  };
  
  const createUserWithout2FA = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: undefined,
      save: jest.fn().mockResolvedValue(true)
    };
  };
  
  const createUserWith2FADisabled = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: {
        enabled: false,
        secret: 'TESTSECRETBASE32',
        recoveryCodes: []
      },
      save: jest.fn().mockResolvedValue(true)
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findById as jest.Mock).mockReset();
    (speakeasy.totp.verify as jest.Mock).mockReset();
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/2fa-disable').default;
    });
  });

  // Success test
  it('should disable 2FA with valid token', async () => {
    // Mock user with 2FA enabled
    const mockUser = createUserWith2FAEnabled();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock valid verification
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    
    const req = createMockRequest('POST', {
      token: '123456'
    });
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify token validation
    expect(speakeasy.totp.verify).toHaveBeenCalledWith({
      secret: 'TESTSECRETBASE32',
      encoding: 'base32',
      token: '123456'
    });
    
    // Verify 2FA was disabled
    expect(mockUser.twoFA.enabled).toBe(false);
    expect(mockUser.save).toHaveBeenCalled();
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ 
      success: true,
      message: '2FA has been disabled and recovery codes invalidated' 
    });
  });

  // Failure tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject when token is missing', async () => {
    const req = createMockRequest('POST', {});
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Authentication code required' });
  });
  
  it('should reject when user not found', async () => {
    // Mock user not found
    (User.findById as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('POST', {
      token: '123456'
    });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'User not found' });
  });
  
  it('should reject when 2FA is not enabled', async () => {
    // Test with user that has 2FA disabled
    const mockUser = createUserWith2FADisabled();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', {
      token: '123456'
    });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: '2FA is not enabled' });
    
    // Now test with user that has no 2FA object
    const userWithout2FA = createUserWithout2FA();
    (User.findById as jest.Mock).mockResolvedValue(userWithout2FA);
    
    const req2 = createMockRequest('POST', {
      token: '123456'
    });
    (req2 as any).session = {...mockSession};
    const res2 = createMockResponse();
    
    await handler(req2, res2);
    
    expect(res2._getStatusCode()).toBe(400);
    expect(res2._getJSONData()).toEqual({ error: '2FA is not enabled' });
  });
  
  it('should reject invalid authentication code', async () => {
    // Mock user with 2FA enabled
    const mockUser = createUserWith2FAEnabled();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock invalid verification
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
    
    const req = createMockRequest('POST', {
      token: 'invalid'
    });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify token validation was attempted
    expect(speakeasy.totp.verify).toHaveBeenCalledWith({
      secret: 'TESTSECRETBASE32',
      encoding: 'base32',
      token: 'invalid'
    });
    
    // Verify 2FA was not disabled
    expect(mockUser.twoFA.enabled).toBe(true);
    expect(mockUser.save).not.toHaveBeenCalled();
    
    // Verify error response
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid authentication code' });
  });
}); 