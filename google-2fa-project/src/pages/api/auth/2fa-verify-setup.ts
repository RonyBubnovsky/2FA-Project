import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import { serialize } from 'cookie'
import { v4 as uuidv4 } from 'uuid'

async function handler(req: NextApiRequest & { session: any }, res: NextApiResponse) {
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

  user.twoFA = { secret: base32, enabled: true }

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
  res.json({ ok: true })
}

export default async function verify2FASetupRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
}
