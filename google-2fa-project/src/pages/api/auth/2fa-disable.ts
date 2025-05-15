import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'

async function handler(req: NextApiRequest & { session: any }, res: NextApiResponse) {
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
  
  // Disable 2FA
  user.twoFA.enabled = false
  await user.save()
  
  return res.json({ success: true })
}

export default async function disable2FARoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
} 