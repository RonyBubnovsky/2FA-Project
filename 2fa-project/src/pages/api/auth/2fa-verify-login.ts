import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
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
  const { token, trustDevice } = req.body
  const userId = req.session.userId
  if (!userId) return res.status(401).end()

  await dbConnect()
  const user = await User.findById(userId)
  if (!user || !user.twoFA?.enabled) return res.status(400).end()

  // Decrypt the secret before verification
  const decryptedSecret = decryptSecret(user.twoFA.secret);
  
  const ok = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token,
  })
  if (!ok) return res.status(400).json({ error: 'Bad code' })

  if (trustDevice) {
    const deviceToken = uuidv4()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    user.trustedDevices = user.trustedDevices || []
    user.trustedDevices.push({ token: deviceToken, expires })
    await user.save()
    res.setHeader('Set-Cookie', serialize('trusted_device', deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    }))
  }

  req.session.twoFAVerified = true
  await req.session.save()
  res.json({ ok: true })
}

export default async function verify2FALoginRoute(req: NextApiRequest, res: NextApiResponse) {
  // Get trustDevice flag from request body for session duration
  const { trustDevice } = req.body as { trustDevice?: boolean }
  const options = getSessionOptions(!!trustDevice)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
}
