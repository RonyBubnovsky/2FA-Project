import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '../../../lib/mail'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import fetch from 'node-fetch'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { validateEmail } from '@/utils/validation'

// Rate limiter configuration: 5 registration attempts per hour from the same IP
const rateLimiter = new RateLimiterMemory({
  points: 5, // 5 registration attempts
  duration: 3600, // per 1 hour
})

// Validation functions
const isValidEmail = validateEmail

const isValidPassword = (password: string) => {
  // Password requirements:
  // - At least 8 characters long
  // - Contains at least one uppercase letter
  // - Contains at least one lowercase letter
  // - Contains at least one number
  // - Contains at least one special character
  const minLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
}

// Define reCAPTCHA response interface
interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

// Verify reCAPTCHA token
async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json() as RecaptchaResponse;
    return !!data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// Mongoose validation error interface
interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  // Apply rate limiting based on IP address
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string
  
  try {
    await rateLimiter.consume(ip)
  } catch {
    return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' })
  }
  
  const { email, firstName, lastName, password, captchaToken } = req.body
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  
  // Verify CAPTCHA first before proceeding
  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA verification is required' })
  }
  
  // Verify the CAPTCHA token with Google's API
  const isValidCaptcha = await verifyCaptcha(captchaToken)
  if (!isValidCaptcha) {
    return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' })
  }
  
  // Email validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }
  
  // Password validation
  if (!isValidPassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character' 
    })
  }
  
  // First name and last name validation
  if (firstName && typeof firstName !== 'string') {
    return res.status(400).json({ error: 'First name must be text only' })
  }
  
  if (lastName && typeof lastName !== 'string') {
    return res.status(400).json({ error: 'Last name must be text only' })
  }
  
  await dbConnect()
  
  // Check if email is already in use
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
  
  try {
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
  } catch (error: unknown) {
    // Handle mongoose validation errors
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        const validationError = error as MongooseValidationError;
        const validationErrors = Object.values(validationError.errors).map(err => err.message)
        return res.status(400).json({ error: validationErrors.join(', ') })
      }
      console.error('Registration error:', error)
    }
    return res.status(500).json({ error: 'Registration failed' })
  }
}
