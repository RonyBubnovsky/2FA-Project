import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import crypto from 'crypto'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const limiter = new RateLimiterMemory({ points: 5, duration: 3600 })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string
  try {
    await limiter.consume(ip)
  } catch {
    return res.status(429).json({ error: 'Too many attempts, try later.' })
  }

  const { token } = req.query
  if (req.method !== 'GET' || typeof token !== 'string') return res.status(400).end()

  await dbConnect()
  const hmacIncoming = crypto
    .createHmac('sha256', process.env.HMAC_SECRET!)
    .update(token)
    .digest('hex')

  const user = await User.findOne({ verificationToken: hmacIncoming })
  if (
    !user ||
    !user.verificationTokenExpiry ||
    user.verificationTokenExpiry < new Date()
  ) {
    return res.status(400).json({ error: 'Invalid or expired token' })
  }

  user.emailVerified = true
  user.verificationToken = undefined
  user.verificationTokenExpiry = undefined
  await user.save()

  return res.json({ ok: true })
}
