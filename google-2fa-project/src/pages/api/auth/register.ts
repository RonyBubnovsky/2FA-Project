import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '../../../lib/mail'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, firstName, lastName, password } = req.body
  await dbConnect()
  if (await User.findOne({ email })) {
    return res.status(400).json({ error: 'Email already in use' })
  }
  const hash = await bcrypt.hash(password, 10)
  const token = uuidv4()
  const hmac = crypto
    .createHmac('sha256', process.env.HMAC_SECRET!)
    .update(token)
    .digest('hex')
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await User.create({
    email,
    firstName,
    lastName,
    password: hash,
    verificationToken: hmac,
    verificationTokenExpiry: expiry,
  })
  await sendVerificationEmail(email, token)
  return res.json({ ok: true })
}
