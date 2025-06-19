import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
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

// Function to hash a recovery code for comparison
function hashRecoveryCode(code: string) {
  return crypto.createHash('sha256')
    .update(code + process.env.RECOVERY_CODE_SECRET!)
    .digest('hex');
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { token } = req.body
  const userId = req.session.userId
  if (!userId) return res.status(401).end()

  await dbConnect()
  const user = await User.findById(userId)
  if (!user || !user.twoFA?.enabled) return res.status(400).end()

  // Make sure the user has recovery codes
  if (!user.twoFA.recoveryCodes || user.twoFA.recoveryCodes.length === 0) {
    return res.status(400).json({ error: 'No recovery codes available' })
  }

  // Hash the provided token for comparison
  const hashedToken = hashRecoveryCode(token)

  // Check if the token matches any of the stored recovery codes
  const recoveryCodeIndex = user.twoFA.recoveryCodes.findIndex(
    rc => rc.code === hashedToken && !rc.used
  )

  if (recoveryCodeIndex === -1) {
    return res.status(400).json({ error: 'Invalid recovery code' })
  }

  // First, mark the specific recovery code as used (for audit purposes)
  // Then immediately disable 2FA and clear all recovery codes for security
  user.twoFA.recoveryCodes[recoveryCodeIndex].used = true
  user.twoFA.enabled = false
  user.twoFA.recoveryCodes = []

  // Log security action
  const securityLog = {
    action: 'RECOVERY_CODE_USED_2FA_DISABLED',
    timestamp: new Date(),
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null
  };
  
  const userDoc = user as unknown as { lastSecurityAction?: typeof securityLog };
  userDoc.lastSecurityAction = securityLog;

  await user.save()

  // Set the session as 2FA verified
  req.session.twoFAVerified = true
  await req.session.save()

  res.json({ 
    ok: true,
    message: 'Recovery code accepted. Two-factor authentication has been disabled for your account.'
  })
}

export default async function recoveryCodeVerifyRoute(req: NextApiRequest, res: NextApiResponse) {
  // Get trustDevice flag from request body for session duration
  const { trustDevice } = req.body as { trustDevice?: boolean }
  const options = getSessionOptions(!!trustDevice)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
} 