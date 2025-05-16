import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('2FA status API', () => {
  // Mock session data
  const mockSession = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
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
  
  const createUserWithout2FA = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: undefined,
      save: jest.fn().mockResolvedValue(true)
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock
    (User.findById as jest.Mock).mockReset();
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/2fa-status').default;
    });
  });

  // Success tests
  it('should return enabled=true when 2FA is enabled', async () => {
    // Mock user with 2FA enabled
    const mockUser = createUserWith2FAEnabled();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ enabled: true });
  });
  
  it('should return enabled=false when 2FA is disabled', async () => {
    // Mock user with 2FA disabled
    const mockUser = createUserWith2FADisabled();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ enabled: false });
  });
  
  it('should return enabled=false when 2FA is not set up', async () => {
    // Mock user without 2FA property
    const mockUser = createUserWithout2FA();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ enabled: false });
  });

  // Failure tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('POST');
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject when no userId in session', async () => {
    const req = createMockRequest('GET');
    (req as any).session = { ...mockSession, userId: undefined };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('should return 404 when user not found', async () => {
    // Mock user not found
    (User.findById as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'User not found' });
  });
}); 