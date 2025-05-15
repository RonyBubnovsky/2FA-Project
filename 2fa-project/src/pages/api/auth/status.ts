import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user session
    const session = await getIronSession<SessionData>(req, res, sessionOptions)
    
    // Return authentication status
    if (session.userId && session.twoFAVerified) {
      return res.status(200).json({ 
        authenticated: true,
        userId: session.userId
      })
    } else {
      return res.status(200).json({ 
        authenticated: false 
      })
    }
  } catch (error) {
    console.error('Auth status error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      authenticated: false 
    })
  }
} 