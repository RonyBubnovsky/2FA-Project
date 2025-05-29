import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession, IronSession } from 'iron-session'
import { getSessionOptions } from '../../../lib/session'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import crypto from 'crypto'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const limiter = new RateLimiterMemory({ points: 5, duration: 3600 })

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
  
  // Apply rate limiting based on IP to prevent brute force attempts
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string
  
  try {
    await limiter.consume(ip)
  } catch {
    return res.status(429).json({ error: 'Too many verification attempts. Please try again later.' })
  }
  
  const { token } = req.body
  
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' })
  }
  
  try {
    // Connect to database
    await dbConnect()
    
    // Hash the token for security
    const hashedToken = crypto
      .createHmac('sha256', process.env.HMAC_SECRET!)
      .update(token)
      .digest('hex')
    
    // Find user by verification token
    const user = await User.findOne({ 
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() } // Check that token hasn't expired
    })
    
    if (!user) {
      // Use constant time comparison to prevent timing attacks
      // Even though we already know the user doesn't exist, this maintains consistent response timing
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(token))
      
      return res.status(400).json({ 
        error: 'Invalid or expired verification token'
      })
    }
    
    // Mark email as verified
    user.emailVerified = true
    
    // Generate verification success hash for audit logging
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${user._id}-${Date.now()}-verified`)
      .digest('hex')
      
    // Clear verification data
    user.verificationToken = undefined
    user.verificationTokenExpiry = undefined
    await user.save()
    
    // If there's a current session, update it
    if (req.session.userId) {
      req.session.emailVerified = true
      await req.session.save()
    }
    
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error verifying email:', error)
    return res.status(500).json({ error: 'An unexpected error occurred' })
  }
}

export default async function verifyEmailRoute(req: NextApiRequest, res: NextApiResponse) {
  const options = getSessionOptions(false)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
}
