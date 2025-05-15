import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { password, token, email } = req.body
  
  if (!password || !token || !email) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  // Validate password strength
  const isStrongPassword = validatePassword(password)
  if (!isStrongPassword) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character' 
    })
  }
  
  await dbConnect()
  
  // Hash the token from the request to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  
  const user = await User.findOne({ 
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  })
  
  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset token' })
  }
  
  // Hash the new password
  const passwordHash = await bcrypt.hash(password, 10)
  
  // Update user with new password and clear reset tokens
  user.password = passwordHash
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  
  // If user has 2FA enabled, we might want to revoke existing trusted devices for security
  if (user.twoFA?.enabled) {
    user.trustedDevices = []
  }
  
  await user.save()
  
  return res.json({ 
    success: true, 
    message: 'Password has been reset successfully. You can now log in with your new password.' 
  })
}

// Password validation function
const validatePassword = (password: string) => {
  const minLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  
  return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
} 