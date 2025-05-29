import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Mock dependencies
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn()
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}));

// Import handler dynamically to ensure mocks are applied
let handler: any;

describe('2FA setup API', () => {
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
      }
    };
  };
  
  const createUserWithout2FA = () => {
    return {
      _id: 'mock-user-id',
      email: 'test@example.com',
      twoFA: undefined
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findById as jest.Mock).mockReset();
    (speakeasy.generateSecret as jest.Mock).mockReset();
    (QRCode.toDataURL as jest.Mock).mockReset();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    
    // Set up default mocks
    (speakeasy.generateSecret as jest.Mock).mockReturnValue({
      base32: 'TESTSECRETBASE32',
      otpauth_url: 'otpauth://totp/My2FAApp?secret=TESTSECRETBASE32'
    });
    
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,QR_CODE_DATA');
    
    // Import handler after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/2fa-setup').default;
    });
  });

  // Success tests
  it('should return QR code when 2FA is not enabled', async () => {
    // Mock user without 2FA
    const mockUser = createUserWithout2FA();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify secret was generated
    expect(speakeasy.generateSecret).toHaveBeenCalledWith({
      name: `My2FAApp (https://example.com)`,
    });
    
    // Verify QR code was generated
    expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/My2FAApp?secret=TESTSECRETBASE32');
    
    // Verify session was updated
    expect((req as any).session.tempSecret).toBe('TESTSECRETBASE32');
    expect((req as any).session.save).toHaveBeenCalled();
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      enabled: false,
      qr: 'data:image/png;base64,QR_CODE_DATA',
      hasSecret: true
    });
  });
  
  it('should return already enabled message when 2FA is already enabled', async () => {
    // Mock user with 2FA already enabled
    const mockUser = createUserWith2FAEnabled();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    await handler(req, res);
    
    // Verify no secret or QR code was generated
    expect(speakeasy.generateSecret).not.toHaveBeenCalled();
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
    
    // Verify session was not updated
    expect((req as any).session.save).not.toHaveBeenCalled();
    
    // Verify response
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      enabled: true,
      message: '2FA is already enabled for your account'
    });
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
  
  it('should handle QR code generation errors', async () => {
    // Mock user without 2FA
    const mockUser = createUserWithout2FA();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Mock QR code generation error
    (QRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR code generation failed'));
    
    const req = createMockRequest('GET');
    (req as any).session = {...mockSession};
    
    const res = createMockResponse();
    
    // Ensure the test doesn't fail due to unhandled promise rejection
    await expect(handler(req, res)).rejects.toThrow('QR code generation failed');
  });
}); 