# API Testing Documentation

This directory contains comprehensive tests for the API routes in the 2FA authentication system.

## Testing Approach

The tests are designed using the following principles:

1. **Isolation**: Each API route is tested in isolation from other components.
2. **Mocking**: External dependencies (MongoDB, email sending, etc.) are mocked to ensure tests are reliable and fast.
3. **Security**: Security-focused test cases are included to validate authentication flows and token handling.
4. **Coverage**: Both positive and negative test cases are covered.

## Test Structure

- `/utils`: Contains test utilities for mocking requests, responses, and database models
- `/api/auth`: Contains tests for all authentication-related API endpoints

## Running Tests

To run all tests:

```bash
npm test
```

To run tests with watch mode:

```bash
npm run test:watch
```

To run tests for a specific file:

```bash
npm test -- tests/api/auth/login.test.ts
```

## Test Technologies

- **Jest**: Test runner and assertion library
- **node-mocks-http**: For mocking Next.js API requests and responses
- **ts-jest**: For TypeScript support in tests

## Common Issues

### Type Errors

Some mock implementations may generate TypeScript errors about `null` or other types not being assignable to `never`.
These warnings can be ignored for test files as they don't affect the actual test execution.

### Authentication Testing

Testing authenticated routes requires mocking the Iron Session. The session is mocked in each test file to simulate
authenticated and unauthenticated states as needed.
