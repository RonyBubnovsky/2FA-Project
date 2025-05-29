import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
  emailVerified?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user session
    const session = await getIronSession<SessionData>(req, res, sessionOptions)
    
    // If no user ID or not 2FA verified, not authenticated
    if (!session.userId || !session.twoFAVerified) {
      return res.status(200).json({ 
        authenticated: false 
      })
    }
    
    // Get the user data to check email verification status
    await dbConnect()
    const user = await User.findById(session.userId)
    
    // If user not found, session is invalid
    if (!user) {
      // Clear invalid session
      session.destroy()
      return res.status(200).json({ 
        authenticated: false 
      })
    }
    
    // Include email verification status in response
    const isEmailVerified = user.emailVerified || session.emailVerified || false
    
    // Return authentication status including email verification status
    return res.status(200).json({ 
      authenticated: true,
      userId: session.userId,
      emailVerified: isEmailVerified
    })
  } catch (error) {
    console.error('Auth status error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      authenticated: false 
    })
  }
} 