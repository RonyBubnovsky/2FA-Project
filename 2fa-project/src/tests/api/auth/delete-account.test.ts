import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';

// Import handler dynamically to ensure mocks are set up first
let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

describe('delete-account API', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findByIdAndDelete as jest.Mock).mockReset();
    
    // Mock iron-session for this test
    jest.mock('iron-session', () => ({
      getIronSession: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          userId: 'mock-user-id',
          destroy: jest.fn().mockImplementation(() => Promise.resolve(null)),
        });
      }),
    }), { virtual: true });
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/delete-account').default;
    });
  });

  // Positive test
  it('should delete user account successfully', async () => {
    // Setup mock for successful account deletion
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      email: 'test@example.com',
    } as any);
    
    const req = createMockRequest('DELETE');
    const res = createMockResponse();
    
    // Spy on setHeader
    const setHeaderSpy = jest.spyOn(res, 'setHeader');
    
    await handler(req, res);
    
    // Verify user was deleted
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('mock-user-id');
    expect(setHeaderSpy).toHaveBeenCalled(); // Cookies should be cleared
    expect(res._getStatusCode()).toBe(200);
    
    const responseData = res._getJSONData();
    expect(responseData.success).toBe(true);
    expect(responseData.accountDeletedToken).toBeDefined();
    expect(typeof responseData.accountDeletedToken).toBe('string');
  });

  // Negative tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ error: 'Method not allowed' });
  });
  
  it('should reject unauthenticated requests', async () => {
    // Mock unauthenticated session
    jest.doMock('iron-session', () => ({
      getIronSession: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          userId: undefined,
          destroy: jest.fn().mockImplementation(() => Promise.resolve(null)),
        });
      }),
    }), { virtual: true });
    
    // Re-import handler with the updated session mock
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/delete-account').default;
    });
    
    const req = createMockRequest('DELETE');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Unauthorized' });
  });
  
  it('should handle user not found', async () => {
    // Mock user not found
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null as any);
    
    const req = createMockRequest('DELETE');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'User not found' });
  });
  
  it('should handle database errors', async () => {
    // Mock database error
    (User.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database error') as any);
    
    const req = createMockRequest('DELETE');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Internal server error' });
  });
}); 