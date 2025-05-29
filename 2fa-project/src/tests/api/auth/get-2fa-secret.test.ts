import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('Get 2FA secret API', () => {
  // Mock session data with and without tempSecret
  const mockSessionWithSecret = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    tempSecret: 'TESTSECRETBASE32',
    save: jest.fn().mockResolvedValue(undefined)
  };

  const mockSessionWithoutSecret = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    save: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/get-2fa-secret').default;
    });
  });

  // Success test
  it('should return secret when available in session', async () => {
    const req = createMockRequest('POST');
    (req as any).session = {...mockSessionWithSecret};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      secret: 'TESTSECRETBASE32'
    });
  });

  // Failure tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    (req as any).session = {...mockSessionWithSecret};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject when no userId in session', async () => {
    const req = createMockRequest('POST');
    (req as any).session = { ...mockSessionWithSecret, userId: undefined };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('should return 404 when no tempSecret in session', async () => {
    const req = createMockRequest('POST');
    (req as any).session = {...mockSessionWithoutSecret};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'No 2FA setup in progress' });
  });
}); 