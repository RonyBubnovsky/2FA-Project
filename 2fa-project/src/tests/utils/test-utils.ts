import type { NextApiRequest, NextApiResponse } from 'next';
import type { IronSession } from 'iron-session';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock NextApiRequest
export const createMockRequest = (
  method: string = 'GET',
  body: Record<string, any> = {},
  query: Record<string, any> = {},
  headers: Record<string, any> = {},
  cookies: string = ''
): NextApiRequest => {
  return {
    method,
    body,
    query,
    headers: {
      ...headers,
      cookie: cookies
    },
    socket: {
      remoteAddress: '127.0.0.1'
    },
    cookies: {}
  } as unknown as NextApiRequest;
};

// Simple custom response type for testing
export interface MockResponse {
  statusCode: number;
  jsonData: any;
  _getStatusCode(): number;
  _getJSONData(): any;
  status(code: number): MockResponse;
  json(data: any): MockResponse;
  setHeader: jest.Mock;
  end: jest.Mock;
}

// Mock NextApiResponse
export const createMockResponse = (): MockResponse => {
  const res = {} as any;
  
  // Add properties
  res.statusCode = 200;
  res.jsonData = {};
  
  // Add methods
  res._getStatusCode = function() { return this.statusCode; };
  res._getJSONData = function() { return this.jsonData; };
  
  // Add mock functions
  res.status = function(code: number) {
    this.statusCode = code;
    return this;
  };
  
  res.json = function(data: any) {
    this.jsonData = data;
    return this;
  };
  
  res.setHeader = jest.fn(() => res);
  res.end = jest.fn(() => res);
  
  return res as MockResponse;
};

// Mock session
export const createMockSession = (sessionData: Record<string, any> = {}): IronSession<Record<string, any>> => {
  return {
    ...sessionData,
    save: jest.fn().mockImplementation(() => Promise.resolve()),
    destroy: jest.fn().mockImplementation(() => Promise.resolve())
  } as unknown as IronSession<Record<string, any>>;
};

// Mock user model and methods
export const mockUserModel = (mockData: Record<string, any> = {}) => {
  const mockUser = {
    ...mockData,
    save: jest.fn().mockImplementation(() => Promise.resolve(mockData)),
  };

  const mockFindOne = jest.fn((_query: any) => {
    // Safe type casting, we know query has properties like email in this context
    const query = _query as Record<string, any>;
    if (mockData && (
      (query.email && query.email === mockData.email) || 
      (query.verificationToken && query.verificationToken === mockData.verificationToken) ||
      (query.resetPasswordToken && query.resetPasswordToken === mockData.resetPasswordToken)
    )) {
      return Promise.resolve(mockUser);
    }
    return Promise.resolve(null);
  });

  const mockFindById = jest.fn((_id: any) => {
    // Safe type casting
    const id = _id as string;
    if (mockData && id === mockData._id) {
      return Promise.resolve(mockUser);
    }
    return Promise.resolve(null);
  });

  const mockFindByIdAndDelete = jest.fn((_id: any) => {
    // Safe type casting
    const id = _id as string;
    if (mockData && id === mockData._id) {
      return Promise.resolve(mockUser);
    }
    return Promise.resolve(null);
  });

  const mockCreate = jest.fn((_data: any) => {
    // Safe type casting
    const data = _data as Record<string, any>;
    return Promise.resolve({ 
      ...(mockData as Record<string, any>), 
      ...data, 
      _id: mockData._id || new mongoose.Types.ObjectId() 
    });
  });

  const mockUpdateOne = jest.fn(() => Promise.resolve({ modifiedCount: 1 }));

  return {
    findOne: mockFindOne,
    findById: mockFindById,
    findByIdAndDelete: mockFindByIdAndDelete,
    create: mockCreate,
    updateOne: mockUpdateOne,
  };
};

// ObjectId generator for testing
export const generateId = (): string => new mongoose.Types.ObjectId().toString();

// Mock dates for testing expiry tokens
export const mockFutureDate = (): Date => new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in future
export const mockPastDate = (): Date => new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past 