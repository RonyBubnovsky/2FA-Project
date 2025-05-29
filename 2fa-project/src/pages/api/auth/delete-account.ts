import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import { v4 as uuidv4 } from 'uuid'
import { serialize } from 'cookie'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
  accountDeletedToken?: string;
}

export default async function handler(
  req: NextApiRequest & { session: IronSession<SessionData> },
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session
    req.session = await getIronSession<SessionData>(
      req,
      res,
      getSessionOptions(false)
    );

    // Check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Connect to database
    await dbConnect();

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(req.session.userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate secure token for account deletion confirmation
    const accountDeletedToken = uuidv4();

    // Properly destroy the session
    req.session.destroy();
    
    // Clear all cookies
    res.setHeader('Set-Cookie', [
      // Clear the main session cookie
      serialize('my2fa_session', '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }),
      // Clear trusted device cookie if exists
      serialize('trusted_device', '', {
        maxAge: 0,
        path: '/',
      })
    ]);

    // Return success with the token
    return res.status(200).json({
      success: true,
      accountDeletedToken
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 