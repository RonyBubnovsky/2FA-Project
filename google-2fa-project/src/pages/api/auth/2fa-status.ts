import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'

async function handler(req: NextApiRequest & { session: any }, res: NextApiResponse) {
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
  const session = await getIronSession(req, res, sessionOptions)
  return handler(Object.assign(req, { session }), res)
} 