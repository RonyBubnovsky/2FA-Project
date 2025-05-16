import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';

// Mock dependencies
jest.mock('speakeasy', () => ({
  totp: {
    verify: jest.fn()
  }
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-device-token')
}));

jest.mock('cookie', () => ({
  serialize: jest.fn().mockReturnValue('trusted_device=mock-device-token; options')
}));

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('2FA verify login API', () => {
  // Mock session data
  const mockSession = {
    userId: 'mock-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    twoFAVerified: false,
    save: jest.fn().mockResolvedValue(undefined)
  };
  
  // Create a fresh mock user for each test
  const createMockUser = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: {
        enabled: true,
        secret: 'TESTSECRETBASE32',
        recoveryCodes: []
      },
      trustedDevices: [] as any[],
      save: jest.fn().mockResolvedValue(true)
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findById as jest.Mock).mockReset();
    (speakeasy.totp.verify as jest.Mock).mockReset();
    (serialize as jest.Mock).mockReset();
    (serialize as jest.Mock).mockReturnValue('trusted_device=mock-device-token; options');
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/2fa-verify-login').default;
    });
  });

  // Success tests
  it('should verify 2FA login with valid token', async () => {
    // Setup mocks for successful verification
    const mockUser = createMockUser();
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', {
      token: '123456'
    });
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify 2FA was checked
    expect(speakeasy.totp.verify).toHaveBeenCalledWith({
      secret: 'TESTSECRETBASE32',
      encoding: 'base32',
      token: '123456'
    });
    
    expect(User.findById).toHaveBeenCalledWith('mock-user-id');
    expect((req as any).session.save).toHaveBeenCalled();
    
    // Should set twoFAVerified
    expect((req as any).session.twoFAVerified).toBe(true);
    
    // Should return success
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });
  
  it('should set up trusted device when requested', async () => {
    // Setup mocks for successful verification with trusted device
    const mockUser = createMockUser();
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', {
      token: '123456',
      trustDevice: true
    });
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    // Spy on setHeader
    const setHeaderSpy = jest.spyOn(res, 'setHeader');
    
    await handler(req, res);
    
    // Verify trusted device was set up
    expect(uuidv4).toHaveBeenCalled();
    expect(serialize).toHaveBeenCalledWith('trusted_device', 'mock-device-token', expect.objectContaining({
      httpOnly: true,
      path: '/',
    }));
    expect(setHeaderSpy).toHaveBeenCalledWith('Set-Cookie', 'trusted_device=mock-device-token; options');
    
    // Should update user's trusted devices
    expect(mockUser.trustedDevices.length).toBe(1);
    expect(mockUser.trustedDevices[0].token).toBe('mock-device-token');
    expect(mockUser.save).toHaveBeenCalled();
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
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
    const req = createMockRequest('POST', { token: '123456' });
    (req as any).session = { ...mockSession, userId: undefined };
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('should reject invalid token', async () => {
    // Mock invalid verification
    const mockUser = createMockUser();
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('POST', { token: 'invalid' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(speakeasy.totp.verify).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Bad code' });
  });
  
  it('should reject when user not found', async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);
    
    const req = createMockRequest('POST', { token: '123456' });
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
    
    const req = createMockRequest('POST', { token: '123456' });
    (req as any).session = {...mockSession};
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
  });
}); 