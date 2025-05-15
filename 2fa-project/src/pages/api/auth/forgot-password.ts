import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { sendPasswordResetEmail } from '../../../lib/mail'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })
  
  await dbConnect()
  
  // Find user by email
  const user = await User.findOne({ email })
  
  // Always return success even if email doesn't exist (security best practice)
  // This prevents email enumeration attacks
  if (!user) {
    return res.json({ 
      success: true, 
      message: 'If your email exists in our system, you will receive reset instructions' 
    })
  }
  
  // Generate a secure random token
  const resetToken = uuidv4()
  
  // Hash the token for database storage (never store plain tokens in DB)
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  
  // Set expiration to 1 hour from now
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000)
  
  // Store the hashed token in the user document
  user.resetPasswordToken = hashedToken
  user.resetPasswordExpires = tokenExpiry
  await user.save()
  
  // Build reset URL with the plain token (not the hashed one)
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
  
  try {
    // Send the password reset email using our mail library
    await sendPasswordResetEmail(email, resetUrl)
    
    return res.json({ 
      success: true, 
      message: 'If your email exists in our system, you will receive reset instructions' 
    })
  } catch (error) {
    console.error('Password reset email error:', error)
    
    // Clear any saved tokens on error
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    
    return res.status(500).json({ error: 'Failed to send reset email' })
  }
} 