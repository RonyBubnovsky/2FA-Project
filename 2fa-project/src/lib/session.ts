import { SessionOptions } from 'iron-session'

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'my2fa_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  },
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
