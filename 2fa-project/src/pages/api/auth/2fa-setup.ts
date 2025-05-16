import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
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
  if (req.method !== 'GET') return res.status(405).end()
  if (!req.session.userId) return res.status(401).end()

  await dbConnect()
  const user = await User.findById(req.session.userId)
  
  if (!user) return res.status(404).json({ error: 'User not found' })
  
  // Check if 2FA is already enabled
  if (user.twoFA?.enabled) {
    return res.json({ 
      enabled: true,
      message: '2FA is already enabled for your account' 
    })
  }

  const secret = speakeasy.generateSecret({
    name: `My2FAApp (${process.env.NEXT_PUBLIC_APP_URL})`,
  })
  const qr = await QRCode.toDataURL(secret.otpauth_url!)
  req.session.tempSecret = secret.base32
  await req.session.save()
  res.json({ enabled: false, qr })
}

export default async function setup2FARoute(req: NextApiRequest, res: NextApiResponse) {
  // Use sessionOptions with 30 days duration to maintain the user's session during setup
  const options = getSessionOptions(true)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
}
