import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../utils/testUtils';
import { User } from '../../../models/User';

// Get reference to the mocked mail module
import * as mailModule from '../../../lib/mail';
const mockSendVerificationEmail = mailModule.sendVerificationEmail as jest.Mock;

// Mock dependencies that aren't already mocked in setup.ts
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed-password')),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed-token'),
  }),
}));

// Mock fetch module - we need to control its behavior in individual tests
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

// Import handler
let handler: any;

describe('register API', () => {
  const validUser = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'Password123!',
    captchaToken: 'valid-captcha-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for fetch - successful CAPTCHA validation
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true })
    });
    
    // Reset mocks
    (User.findOne as jest.Mock).mockReset();
    (User.create as jest.Mock).mockReset();
    mockSendVerificationEmail.mockReset();
    
    // Import handler inside beforeEach to use latest mocks
    jest.isolateModules(() => {
      handler = require('../../../pages/api/auth/register').default;
    });
  });

  // Positive tests
  it('should register a new user with valid data', async () => {
    // Set up mocks for successful registration
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue({
      _id: 'new-user-id',
      ...validUser,
      password: 'hashed-password',
    });

    const req = createMockRequest('POST', validUser);
    const res = createMockResponse();

    await handler(req, res);

    // Verify user was created
    expect(User.findOne).toHaveBeenCalledWith({ email: validUser.email });
    expect(User.create).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      validUser.email,
      'test-uuid'
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
  });

  it('should reject when captcha verification fails', async () => {
    // Set fetch to return failed CAPTCHA verification
    mockFetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ success: false })
    });

    const req = createMockRequest('POST', validUser);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'CAPTCHA verification failed. Please try again.' });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should reject when captcha token is missing', async () => {
    const { captchaToken, ...userWithoutCaptcha } = validUser;
    
    const req = createMockRequest('POST', userWithoutCaptcha);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'CAPTCHA verification is required' });
    expect(User.create).not.toHaveBeenCalled();
  });

  // Negative tests
  it('should reject invalid request method', async () => {
    const req = createMockRequest('GET');
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('should reject when email is missing', async () => {
    const { email, ...userWithoutEmail } = validUser;
    
    const req = createMockRequest('POST', userWithoutEmail);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Email and password are required' });
  });

  it('should reject when password is missing', async () => {
    const { password, ...userWithoutPassword } = validUser;
    
    const req = createMockRequest('POST', userWithoutPassword);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Email and password are required' });
  });

  it('should reject invalid email format', async () => {
    const req = createMockRequest('POST', {
      ...validUser,
      email: 'not-an-email',
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid email format' });
  });

  it('should reject weak password', async () => {
    const req = createMockRequest('POST', {
      ...validUser,
      password: 'weak',
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toContain('Password must be at least 8 characters');
  });

  it('should reject if email already in use', async () => {
    // Mock that user already exists
    (User.findOne as jest.Mock).mockResolvedValue({
      email: validUser.email,
    });

    const req = createMockRequest('POST', validUser);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Email already in use' });
  });

  it('should handle database error during creation', async () => {
    // Mock database error
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    const req = createMockRequest('POST', validUser);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Registration failed' });
  });

  it('should handle validation error during creation', async () => {
    // Mock validation error
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    Object.defineProperty(validationError, 'errors', {
      value: {
        email: { message: 'Email is required' },
      },
    });

    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockRejectedValue(validationError);

    const req = createMockRequest('POST', validUser);
    const res = createMockResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().error).toBe('Email is required');
  });
}); 