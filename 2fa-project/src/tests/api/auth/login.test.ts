import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import mongoose from 'mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../../models/User';

// Mock dependencies
jest.mock('../../../lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve(true)),
}));

// Mock bcrypt with proper interface
const mockCompare = jest.fn() as any;
mockCompare.mockResolvedValue(true);

jest.mock('bcryptjs', () => ({
  compare: mockCompare
}));

// Create a mock session object
const mockSessionSave = jest.fn() as any;
mockSessionSave.mockResolvedValue(undefined);
const mockSession = {
  save: mockSessionSave
};

jest.mock('iron-session', () => ({
  getIronSession: jest.fn().mockImplementation((_req, _res, _options) => {
    return Promise.resolve(mockSession);
  }),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

// Mock cookie functions
const mockParse = jest.fn() as any;
mockParse.mockReturnValue({});

jest.mock('cookie', () => ({
  parse: mockParse,
  serialize: jest.fn().mockReturnValue('mocked-cookie')
}));

// Use dynamic import to prevent jest from automatically hoisting the mock
let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

describe('login API', () => {
  // Mock user data
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockSave = jest.fn() as any;
  mockSave.mockResolvedValue(undefined);
  
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashed-password',
    emailVerified: true,
    trustedDevices: [] as { token: string; expires: Date }[],
    save: mockSave
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset mocks
    (User.findOne as any).mockReset();
    mockCompare.mockReset();
    mockCompare.mockResolvedValue(true);
    mockSessionSave.mockClear();
    mockParse.mockReset();
    mockParse.mockReturnValue({});
    
    // Import handler only after mocks are set up
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/login').default;
    });
  });

  // Custom JSON implementation for response
  const createCustomJsonImplementation = () => {
    return function(this: any, data: any) {
      this.jsonData = data;
      return this;
    };
  };

  // Positive tests
  it('should login successfully with valid credentials (no 2FA)', async () => {
    // Mock successful authentication
    (User.findOne as any).mockResolvedValue({
      ...mockUser,
      twoFA: undefined  // Ensure twoFA is undefined
    });
    
    // Ensure cookie parsing returns empty object (no trusted device)
    mockParse.mockReturnValue({});
    
    // Create request with login credentials
    const req = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'correct-password',
    });
    const res = createMockResponse();
    res.json = jest.fn().mockImplementation(createCustomJsonImplementation());
    
    // Call handler
    await handler(req, res);
    
    // Verify results
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(mockCompare).toHaveBeenCalled();
    expect(mockSessionSave).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    
    // Test that jsonData contains expected properties
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.twoFAEnabled).toBe(false);
    // By default, isTrusted should be undefined when no trusted device exists
    expect('isTrusted' in res.jsonData).toBe(true);
    expect(res.jsonData.isTrusted).toBeUndefined();
  });

  it('should handle "remember me" option correctly', async () => {
    // Mock successful authentication
    (User.findOne as any).mockResolvedValue(mockUser);
    
    // Create request with remember option
    const req = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'correct-password',
      remember: true,
    });
    const res = createMockResponse();
    res.json = jest.fn().mockImplementation(createCustomJsonImplementation());
    
    // Call handler
    await handler(req, res);
    
    // Verify results
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.trustedDevices.length).toBeGreaterThan(0);
    expect(mockSessionSave).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  // Negative tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(405);
  });
  
  it('should reject invalid credentials', async () => {
    // Mock user found but wrong password
    (User.findOne as any).mockResolvedValue(mockUser);
    mockCompare.mockResolvedValue(false);
    
    const req = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'wrong-password',
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid credentials' });
  });
  
  it('should reject unverified email', async () => {
    // Mock user found but email not verified
    const unverifiedUser = {
      ...mockUser,
      emailVerified: false,
    };
    
    (User.findOne as any).mockResolvedValue(unverifiedUser);
    
    const req = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'password',
    });
    const res = createMockResponse();
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(403);
    expect(res._getJSONData()).toEqual({ error: 'Email not verified' });
  });
  
  it('should handle user with 2FA enabled', async () => {
    // Mock user with 2FA
    const userWith2FA = {
      ...mockUser,
      twoFA: {
        enabled: true,
        secret: 'test-secret',
      },
    };
    
    // Ensure cookie parsing returns empty object (no trusted device)
    mockParse.mockReturnValue({});
    
    (User.findOne as any).mockResolvedValue(userWith2FA);
    
    const req = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'correct-password',
    });
    const res = createMockResponse();
    res.json = jest.fn().mockImplementation(createCustomJsonImplementation());
    
    // Call handler
    await handler(req, res);
    
    expect(mockSessionSave).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    
    // Test that jsonData contains expected properties
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.twoFAEnabled).toBe(true);
    // By default, isTrusted should be undefined when no trusted device exists
    expect('isTrusted' in res.jsonData).toBe(true);
    expect(res.jsonData.isTrusted).toBeUndefined();
  });
  
  it('should recognize trusted device for 2FA', async () => {
    // Create a trusted device token that hasn't expired
    const validToken = 'valid-trust-token';
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Mock user with 2FA and trusted device
    const userWithTrustedDevice = {
      ...mockUser,
      twoFA: {
        enabled: true,
      },
      trustedDevices: [
        { token: validToken, expires: futureDate }
      ],
    };
    
    // Mock cookie parsing to return the trusted device token
    mockParse.mockReturnValue({ trusted_device: validToken });
    
    (User.findOne as any).mockResolvedValue(userWithTrustedDevice);
    
    // Create request with trusted device cookie 
    const req = createMockRequest(
      'POST',
      { email: 'test@example.com', password: 'correct-password' },
      {},
      { cookie: `trusted_device=${validToken}` }
    );
    const res = createMockResponse();
    res.json = jest.fn().mockImplementation(createCustomJsonImplementation());
    
    // Call handler
    await handler(req, res);
    
    expect(mockParse).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
    
    // Test that with a trusted device token, isTrusted should be true
    expect(res.jsonData).toBeDefined();
    expect(res.jsonData.twoFAEnabled).toBe(true);
    expect(res.jsonData.isTrusted).toBe(true);
  });
}); 