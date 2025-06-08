import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import crypto from 'crypto';

// Mock dependencies
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  digest: jest.fn().mockReturnValue('hashed-recovery-code')
}));

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('Recovery code verify API', () => {
  // Mock session data
  const mockSession = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    twoFAVerified: false,
    save: jest.fn().mockResolvedValue(undefined)
  };
  
  // Create a mock user with recovery codes
  const createMockUser = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: {
        enabled: true,
        secret: 'TESTSECRETBASE32',
        recoveryCodes: [
          { code: 'hashed-recovery-code', used: false },
          { code: 'another-hashed-code', used: false },
          { code: 'used-hashed-code', used: true }
        ]
      },
      save: jest.fn().mockResolvedValue(true)
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findById as jest.Mock).mockReset();
    (crypto.createHash as jest.Mock).mockReturnThis();
    (crypto.update as jest.Mock).mockReturnThis();
    (crypto.digest as jest.Mock).mockReturnValue('hashed-recovery-code');
    
    // Set up environment variables
    process.env.RECOVERY_CODE_SECRET = 'test-recovery-code-secret';
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/recovery-code-verify').default;
    });
  });

  // Success tests
  it('should verify recovery code and disable 2FA', async () => {
    // Setup mocks for successful verification
    const mockUser = createMockUser();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', {
      token: 'valid-recovery-code'
    });
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify crypto was called to hash the token
    expect(crypto.createHash).toHaveBeenCalledWith('sha256');
    expect(crypto.update).toHaveBeenCalledWith('valid-recovery-code' + process.env.RECOVERY_CODE_SECRET);
    expect(crypto.digest).toHaveBeenCalledWith('hex');
    
    // Verify user was found and updated
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    
    // Verify recovery code was marked as used
    expect(mockUser.twoFA.recoveryCodes[0].used).toBe(true);
    
    // Verify 2FA was disabled
    expect(mockUser.twoFA.enabled).toBe(false);
    expect(mockUser.save).toHaveBeenCalled();
    
    // Verify session was updated
    expect((req as any).session.twoFAVerified).toBe(true);
    expect((req as any).session.save).toHaveBeenCalled();
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ 
      ok: true,
      message: 'Recovery code accepted. Two-factor authentication has been disabled for your account.'
    });
  });
  
  it('should handle trusted device parameter correctly', async () => {
    // Setup mocks for successful verification with trusted device
    const mockUser = createMockUser();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', {
      token: 'valid-recovery-code',
      trustDevice: true
    });
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // All verifications should still pass
    expect(mockUser.save).toHaveBeenCalled();
    expect((req as any).session.twoFAVerified).toBe(true);
    expect(res._getStatusCode()).toBe(200);
  });

  // Failure tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject when no userId in session', async () => {
    const req = createMockRequest('POST', { token: 'valid-code' });
    (req as any).session = { ...mockSession, userId: undefined };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('should reject when user not found', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('POST', { token: 'valid-code' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect(res._getStatusCode()).toBe(400);
  });
  
  it('should reject when 2FA not enabled for user', async () => {
    const mockUser = createMockUser();
    mockUser.twoFA.enabled = false;
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', { token: 'valid-code' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
  });
  
  it('should reject when no recovery codes available', async () => {
    const mockUser = createMockUser();
    mockUser.twoFA.recoveryCodes = [];
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', { token: 'valid-code' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'No recovery codes available' });
  });
  
  it('should reject invalid recovery code', async () => {
    // Mock a different hash result to simulate invalid code
    (crypto.digest as jest.Mock).mockReturnValue('different-hash');
    
    const mockUser = createMockUser();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', { token: 'invalid-code' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid recovery code' });
  });
  
  it('should reject already used recovery code', async () => {
    // Set up so that all codes appear as used
    const mockUser = createMockUser();
    mockUser.twoFA.recoveryCodes.forEach(rc => rc.used = true);
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', { token: 'used-code' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid recovery code' });
  });
}); 