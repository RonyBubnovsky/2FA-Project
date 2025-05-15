import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import { serialize } from 'cookie'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
}

// Function to generate a random recovery code
function generateRecoveryCode() {
  // Generate an 8-character random string (alphanumeric)
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Function to hash a recovery code for secure storage
function hashRecoveryCode(code: string) {
  return crypto.createHash('sha256')
    .update(code + process.env.RECOVERY_CODE_SECRET!)
    .digest('hex');
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { token, trustDevice } = req.body
  const base32 = req.session.tempSecret
  if (!base32) return res.status(400).json({ error: 'No secret' })

  const ok = speakeasy.totp.verify({
    secret: base32,
    encoding: 'base32',
    token,
  })
  if (!ok) return res.status(400).json({ error: 'Invalid code' })

  await dbConnect()
  const user = await User.findById(req.session.userId)
  if (!user) return res.status(400).end()

  // Generate 10 recovery codes
  const recoveryCodes = Array.from({ length: 10 }, () => generateRecoveryCode());
  
  // Hash each recovery code before storing
  const hashedRecoveryCodes = recoveryCodes.map(code => ({
    code: hashRecoveryCode(code),
    used: false
  }));

  // Set up 2FA with recovery codes
  user.twoFA = { 
    secret: base32, 
    enabled: true,
    recoveryCodes: hashedRecoveryCodes
  };

  if (trustDevice) {
    const deviceToken = uuidv4()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    user.trustedDevices = user.trustedDevices || []
    user.trustedDevices.push({ token: deviceToken, expires })
    res.setHeader('Set-Cookie', serialize('trusted_device', deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    }))
  }

  await user.save()
  delete req.session.tempSecret
  req.session.twoFAVerified = true
  await req.session.save()
  
  // Return the unhashed recovery codes to the client
  res.json({ 
    ok: true,
    recoveryCodes: recoveryCodes
  })
}

export default async function verify2FASetupRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
}
