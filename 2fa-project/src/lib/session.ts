import { SessionOptions } from 'iron-session'

// Default session options with max age of 1 hour
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'my2fa_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour for non-remembered sessions
  },
}

// Get session options with configurable max age
export function getSessionOptions(remember: boolean): SessionOptions {
  return {
    ...sessionOptions,
    cookieOptions: {
      ...sessionOptions.cookieOptions,
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60, // 30 days if remember is true, 1 hour otherwise
    },
  }
}

declare module 'iron-session' {
  interface IronSessionData {
    userId?: string
    email?: string
    firstName?: string
    lastName?: string
    twoFAVerified?: boolean
    tempSecret?: string
  }
}
