import type { NextApiRequest, NextApiResponse } from 'next';
import type { RequestMethod } from 'node-mocks-http';
import httpMocks from 'node-mocks-http';

/**
 * Creates a mock NextApiRequest object
 */
export const createMockRequest = (
  method: RequestMethod = 'GET',
  body: Record<string, any> = {},
  query: Record<string, any> = {},
  headers: Record<string, any> = {}
): NextApiRequest => {
  return httpMocks.createRequest({
    method,
    body,
    query,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers
    }
  }) as unknown as NextApiRequest;
};

/**
 * Creates a mock NextApiResponse object with useful test helpers
 */
export const createMockResponse = (): NextApiResponse & {
  _getStatusCode: () => number;
  _getJSONData: () => any;
} => {
  return httpMocks.createResponse({
    eventEmitter: require('events').EventEmitter
  }) as unknown as NextApiResponse & {
    _getStatusCode: () => number;
    _getJSONData: () => any;
  };
};

/**
 * Helper to generate IDs for testing
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
}; 