import { jest } from '@jest/globals';
import type { IUser } from '../models/User';

// Mock environment variables
process.env.HMAC_SECRET = 'test_hmac_secret';
process.env.RECOVERY_CODE_SECRET = 'test_recovery_code_secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
// Don't reassign NODE_ENV as it's read-only

// Mock MongoDB connection
jest.mock('../lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve(null)),
}));

// Mock the User model with proper typings
const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdateOne = jest.fn();
const mockFindByIdAndDelete = jest.fn();

// Create a mock User object with appropriate methods
const mockUserModel = {
  findOne: mockFindOne,
  findById: mockFindById,
  create: mockCreate,
  updateOne: mockUpdateOne,
  findByIdAndDelete: mockFindByIdAndDelete,
};

// Mock the User model module
jest.mock('../models/User', () => ({
  __esModule: true,
  User: mockUserModel
}));

// Mock mail sending functions
jest.mock('../lib/mail', () => ({
  sendVerificationEmail: jest.fn().mockImplementation(() => Promise.resolve(null)),
  sendPasswordResetEmail: jest.fn().mockImplementation(() => Promise.resolve(null)),
}));

// Mock iron-session
jest.mock('iron-session', () => ({
  getIronSession: jest.fn().mockImplementation((req: any, res: any, options: any) => {
    return req.session || {};
  }) as any,
}));

// Mock rate limiter
jest.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: jest.fn().mockImplementation(() => ({
    consume: jest.fn().mockImplementation(() => Promise.resolve(null)),
  })) as any,
})); 