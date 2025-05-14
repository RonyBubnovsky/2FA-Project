import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

async function handler(req: NextApiRequest & { session: any }, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!req.session.userId) return res.status(401).end()

  const secret = speakeasy.generateSecret({
    name: `My2FAApp (${process.env.NEXT_PUBLIC_APP_URL})`,
  })
  const qr = await QRCode.toDataURL(secret.otpauth_url!)
  req.session.tempSecret = secret.base32
  await req.session.save()
  res.json({ qr })
}

export default async function setup2FARoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
}
