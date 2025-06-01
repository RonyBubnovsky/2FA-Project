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
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Rate limiter configuration: 5 login attempts per hour from the same IP
const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 login attempts
  duration: 3600, // per 1 hour
})

// Constants for account lockout
const MAX_FAILED_ATTEMPTS = 5
const BASE_LOCKOUT_MINUTES = 5
const FAILED_ATTEMPTS_RESET_MINUTES = 15

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
  
  // Apply rate limiting based on IP address
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string
  
  try {
    await rateLimiter.consume(ip)
  } catch {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' })
  }
  
  const { email, password, remember } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  
  await dbConnect()
  
  // Find user by email
  const user = await User.findOne({ email })
  if (!user) {
    // For security reasons, don't reveal that the email doesn't exist
    return res.status(400).json({ error: 'Invalid credentials' })
  }
  
  // Check if account is locked
  const now = new Date()
  if (user.lockedUntil && user.lockedUntil > now) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000))
    return res.status(403).json({ 
      error: `Account is temporarily locked. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.` 
    })
  }
  
  // Reset failed login attempts if last failure was more than FAILED_ATTEMPTS_RESET_MINUTES ago
  if (user.lastFailedLoginAt && user.failedLoginAttempts > 0) {
    const minutesSinceLastFailure = (now.getTime() - user.lastFailedLoginAt.getTime()) / (60 * 1000)
    if (minutesSinceLastFailure > FAILED_ATTEMPTS_RESET_MINUTES) {
      user.failedLoginAttempts = 0
      // Don't save yet - we'll save after checking the password
    }
  }
  
  // Validate password
  const valid = await bcrypt.compare(password, user.password)
  
  if (!valid) {
    // Increment failed login attempts
    user.failedLoginAttempts += 1
    user.lastFailedLoginAt = now
    
    // Check if we need to lock the account
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      // Increment lockout count (starts at 0)
      user.lockoutCount += 1
      
      // Calculate lockout duration based on lockout count
      const lockoutMinutes = BASE_LOCKOUT_MINUTES * user.lockoutCount
      
      // Set lockout expiry
      user.lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000)
      
      // Reset failed attempts counter
      user.failedLoginAttempts = 0
      
      await user.save()
      
      return res.status(403).json({ 
        error: `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.` 
      })
    }
    
    await user.save()
    return res.status(400).json({ error: 'Invalid credentials' })
  }
  
  // Password is valid, reset failed attempts and lockout count if any
  user.failedLoginAttempts = 0
  if (user.lockoutCount > 0) {
    user.lockoutCount = 0
  }
  user.lockedUntil = undefined
  user.lastFailedLoginAt = undefined
  await user.save()

  // No longer blocking unverified emails from logging in
  // We'll just set a flag in the session
  
  const cookies = parse(req.headers.cookie || '')
  const trustToken = cookies.trusted_device
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
  req.session.emailVerified = user.emailVerified
  
  await req.session.save()
  return res.json({ 
    twoFAEnabled: !!user.twoFA?.enabled, 
    isTrusted,
    emailVerified: user.emailVerified
  })
}

export default async function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  // Get remember flag from request body for session duration
  const { remember } = req.body as { remember?: boolean }
  const options = getSessionOptions(!!remember)
  const session = await getIronSession<SessionData>(req, res, options)
  return handler(Object.assign(req, { session }), res)
}
