import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import { serialize } from 'cookie'
import { parse } from 'cookie'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  // Get the trusted_device cookie if it exists
  const cookies = parse(req.headers.cookie || '')
  const trustToken = cookies.trusted_device
  
  // If there's a user ID and trust token, remove that token from the database
  if (req.session.userId && trustToken) {
    try {
      await dbConnect()
      await User.updateOne(
        { _id: req.session.userId },
        { $pull: { trustedDevices: { token: trustToken } } }
      )
    } catch (error) {
      console.error('Error removing trusted device:', error)
      // Continue with logout even if this fails
    }
  }
  
  req.session.destroy()
  
  // Clear the trusted_device cookie
  res.setHeader('Set-Cookie', [
    serialize('trusted_device', '', {
      maxAge: 0,
      path: '/',
    }),
    // Also clear the main session cookie
    serialize('my2fa_session', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  ])
  
  return res.json({ ok: true, redirectUrl: '/login' })
}

export default async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
}
