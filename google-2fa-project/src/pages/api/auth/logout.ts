import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import { serialize } from 'cookie'

async function handler(req: NextApiRequest & { session: any }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  req.session.destroy()
  
  // Clear the trusted_device cookie
  res.setHeader('Set-Cookie', [
    serialize('trusted_device', '', {
      maxAge: 0,
      path: '/',
    }),
    // Also clear the main session cookie
    serialize('my2fa_session', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  ])
  
  return res.json({ ok: true, redirectUrl: '/login' })
}

export default async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
}
