import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  // Only allow POST requests to reduce the risk of CSRF
  if (req.method !== 'POST') return res.status(405).end()
  
  // Ensure user is authenticated
  if (!req.session.userId) return res.status(401).end()
  
  // Ensure the session contains a temporary secret
  if (!req.session.tempSecret) {
    return res.status(404).json({ error: 'No 2FA setup in progress' })
  }

  // Return the secret from the session
  res.json({ secret: req.session.tempSecret })
}

export default async function get2FASecretRoute(req: NextApiRequest, res: NextApiResponse) {
  const options = getSessionOptions(true)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
} 