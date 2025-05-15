import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import { serialize } from 'cookie'
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
  // Only allow DELETE requests
  if (req.method !== 'DELETE') return res.status(405).end()
  
  // Check if user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    await dbConnect()
    
    // Find and delete the user
    const deleteResult = await User.findByIdAndDelete(req.session.userId)
    
    // If user wasn't found, return error
    if (!deleteResult) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Destroy the session
    req.session.destroy()
    
    // Clear all cookies
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
    
    return res.json({ ok: true, message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return res.status(500).json({ error: 'Failed to delete account' })
  }
}

export default async function deleteAccountRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
} 