import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import crypto from 'crypto'
import { sendVerificationEmail } from '../../../lib/mail'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Rate limiter: 3 resend attempts per hour
const limiter = new RateLimiterMemory({
  points: 3, // 3 requests
  duration: 3600, // per 1 hour
})

interface SessionData {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  twoFAVerified?: boolean;
  tempSecret?: string;
  emailVerified?: boolean;
}

async function handler(req: NextApiRequest & { session: IronSession<SessionData> }, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  // Apply rate limiting based on IP to prevent abuse
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string
  
  try {
    await limiter.consume(ip)
  } catch {
    return res.status(429).json({ 
      error: 'Too many verification attempts. Please try again later.' 
    })
  }
  
  // Ensure user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in to resend a verification email' })
  }

  try {
    // Connect to database
    await dbConnect()
    
    // Find user
    const user = await User.findById(req.session.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' })
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex')
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    // Hash the token before storing in the database
    const hashedToken = crypto
      .createHmac('sha256', process.env.HMAC_SECRET!)
      .update(verificationToken)
      .digest('hex')
    
    // Update user with hashed token
    user.verificationToken = hashedToken
    user.verificationTokenExpiry = verificationTokenExpiry
    await user.save()
    
    // Send the unhashed token in the email
    await sendVerificationEmail(user.email, verificationToken)
    
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error sending verification email:', error)
    return res.status(500).json({ error: 'Failed to send verification email' })
  }
}

export default async function resendVerificationRoute(req: NextApiRequest, res: NextApiResponse) {
  const options = getSessionOptions(false)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
} 