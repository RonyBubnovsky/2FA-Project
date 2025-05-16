import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import bcrypt from 'bcryptjs'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
import { parse } from 'cookie'
import mongoose from 'mongoose'
import { serialize } from 'cookie'
import { v4 as uuidv4 } from 'uuid'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, remember } = req.body
  await dbConnect()
  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })
  if (!user.emailVerified) return res.status(403).json({ error: 'Email not verified' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' })

  const cookies = parse(req.headers.cookie || '')
  const trustToken = cookies.trusted_device
  const now = new Date()
  const isTrusted =
    trustToken &&
    user.trustedDevices?.some(d => d.token === trustToken && d.expires > now)

  // Handle "remember this device" option when 2FA is not required
  if (remember && !user.twoFA?.enabled) {
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

  req.session.userId = (user._id as mongoose.Types.ObjectId).toString()
  req.session.email = user.email
  req.session.firstName = user.firstName
  req.session.lastName = user.lastName
  req.session.twoFAVerified = isTrusted || !user.twoFA?.enabled
  
  await req.session.save()
  return res.json({ twoFAEnabled: !!user.twoFA?.enabled, isTrusted })
}

export default async function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  // Get remember flag from request body for session duration
  const { remember } = req.body as { remember?: boolean }
  const options = getSessionOptions(!!remember)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
}
