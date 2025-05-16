import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '../../../lib/mail'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// Validation functions
const isValidEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email)
}

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

// Mongoose validation error interface
interface MongooseValidationError extends Error {
  errors: Record<string, { message: string }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email, firstName, lastName, password } = req.body
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
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
