import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import crypto from 'crypto'

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

// Function to decrypt the stored 2FA secret
function decryptSecret(encryptedSecret: string): string {
  const encryptionKey = process.env.SECRET_ENCRYPTION_KEY!;
  const parts = encryptedSecret.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );
  
  // Decrypt the data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
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
  
  // Decrypt the secret before verification
  const decryptedSecret = decryptSecret(user.twoFA.secret);
  
  // Verify the token against the stored 2FA secret
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token
  })
  
  if (!verified) {
    return res.status(400).json({ error: 'Invalid authentication code' })
  }
  
  // First, mark the specific recovery code as used (for audit purposes)
  // Then immediately disable 2FA and clear all recovery codes for security
  user.twoFA.enabled = false;
  user.twoFA.recoveryCodes = [];

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