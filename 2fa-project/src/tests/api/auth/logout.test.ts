import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';

// Mock dependencies
jest.mock('../../../lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve(null)),
}));

// Mock Iron Session
const mockSession = {
  userId: 'mock-user-id',
  destroy: jest.fn().mockImplementation(() => Promise.resolve(null)),
};

// Import handler with proper typing
let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

describe('logout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.updateOne as jest.Mock).mockReset();
    (User.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
    
    // Mock Iron Session
    jest.mock('iron-session', () => ({
      getIronSession: jest.fn().mockImplementation(() => {
        return Promise.resolve(mockSession);
      }),
    }), { virtual: true });
    
    // Mock cookie parser
    jest.mock('cookie', () => ({
      parse: jest.fn().mockReturnValue({ trusted_device: 'mock-device-token' }),
      serialize: jest.fn().mockReturnValue('cookie=value'),
    }), { virtual: true });
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/logout').default;
    });
  });

  // Positive test
  it('should log user out and clear cookies', async () => {
    const req = createMockRequest('POST');
    req.headers.cookie = 'trusted_device=mock-device-token'; // Add cookie to request
    const res = createMockResponse();
    
    // Spy on setHeader method
    const setHeaderSpy = jest.spyOn(res, 'setHeader');
    
    await handler(req, res);
    
    // Verify session was destroyed
    expect(mockSession.destroy).toHaveBeenCalled();
    
    // Verify cookies were cleared
    expect(setHeaderSpy).toHaveBeenCalledWith('Set-Cookie', expect.any(Array));
    
    // Verify trusted device was removed from database
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'mock-user-id' },
      { $pull: { trustedDevices: { token: 'mock-device-token' } } }
    );
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      ok: true,
      redirectUrl: '/login'
    });
  });

  // Test logging out without trusted device token
  it('should log user out without removing trusted device', async () => {
    // Override cookie parser to return empty object (no trusted device)
    jest.doMock('cookie', () => ({
      parse: jest.fn().mockReturnValue({}),
      serialize: jest.fn().mockReturnValue('cookie=value'),
    }), { virtual: true });
    
    // Re-import handler with the updated mock
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/logout').default;
    });
    
    const req = createMockRequest('POST');
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify session was destroyed
    expect(mockSession.destroy).toHaveBeenCalled();
    
    // Verify trusted device was not removed from database
    expect(User.updateOne).not.toHaveBeenCalled();
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      ok: true,
      redirectUrl: '/login'
    });
  });

  // Negative test
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });

  // Test error handling when removing trusted device
  it('should handle database errors gracefully', async () => {
    // Mock database error
    (User.updateOne as jest.Mock).mockRejectedValueOnce(new Error('Database error') as any);
    
    const req = createMockRequest('POST');
    req.headers.cookie = 'trusted_device=mock-device-token';
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Should still destroy session and return success
    expect(mockSession.destroy).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toMatchObject({
      ok: true,
      redirectUrl: '/login'
    });
  });
}); 