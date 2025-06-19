import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
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

// Interface for security log
interface SecurityLog {
  action: string;
  timestamp: Date;
  ipAddress: string | string[] | null;
  userAgent: string | null;
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { token } = req.body
  
  if (!token) return res.status(400).json({ error: 'Authentication code required' })
  
  await dbConnect()
  const user = await User.findById(req.session.userId)
  
  if (!user) return res.status(404).json({ error: 'User not found' })
  
  if (!user.twoFA?.enabled || !user.twoFA?.secret) {
    return res.status(400).json({ error: '2FA is not enabled' })
  }
  
  // Verify the token against the stored 2FA secret
  const verified = speakeasy.totp.verify({
    secret: user.twoFA.secret,
    encoding: 'base32',
    token
  })
  
  if (!verified) {
    return res.status(400).json({ error: 'Invalid authentication code' })
  }
  
  // Disable 2FA and clear recovery codes
  user.twoFA.enabled = false;
  
  // Clear recovery codes if they exist
  if (user.twoFA.recoveryCodes && user.twoFA.recoveryCodes.length > 0) {
    user.twoFA.recoveryCodes = [];
  }
  
  // Log the action using a simple note in the database
  const securityLog: SecurityLog = {
    action: '2FA_DISABLED',
    timestamp: new Date(),
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null
  };
  // Use direct property assignment with a two-step type assertion
  // for safer type conversion that satisfies the linter
  const userDoc = user as unknown as { lastSecurityAction?: SecurityLog };
  userDoc.lastSecurityAction = securityLog;
  
  await user.save();
  
  return res.json({ success: true, message: '2FA has been disabled and recovery codes invalidated' })
}

export default async function disable2FARoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
} 