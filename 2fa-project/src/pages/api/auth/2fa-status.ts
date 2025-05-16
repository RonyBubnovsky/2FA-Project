import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
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

  return res.json({
    enabled: !!user.twoFA?.enabled,
  })
}

export default async function twoFAStatusRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
} 