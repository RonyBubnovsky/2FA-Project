import { NextApiRequest, NextApiResponse } from 'next'
import dbConnect from '../../../lib/mongodb'
import { User } from '../../../models/User'
import bcrypt from 'bcryptjs'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../../lib/session'
import mongoose from 'mongoose'

interface SessionData {
  userId?: string
  twoFAVerified?: boolean
  tempSecret?: string
  email?: string
  firstName?: string
  lastName?: string
  emailVerified?: boolean
}

// Update the User model to include passwordHistory
interface UserWithPasswordHistory extends mongoose.Document {
  email: string
  password: string
  passwordHistory?: string[]
  firstName?: string
  lastName?: string
  emailVerified: boolean
  twoFA?: {
    secret: string
    enabled: boolean
  }
  trustedDevices?: Array<{
    token: string
    expires: Date
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the session
    const session = await getIronSession<SessionData>(req, res, sessionOptions)

    // Check if user is authenticated
    if (!session.userId || !session.twoFAVerified) {
      return res.status(401).json({ error: 'You must be logged in to change your password' })
    }

    const { currentPassword, newPassword } = req.body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    // Validate password strength
    const isStrongPassword = validatePassword(newPassword)
    if (!isStrongPassword) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      })
    }

    await dbConnect()

    // Find the user
    const user = await User.findById(session.userId) as UserWithPasswordHistory
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // First check if new password matches current password
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password)
    if (isSameAsCurrent) {
      return res.status(400).json({
        error: 'Your new password cannot be the same as your current password'
      })
    }

    // Initialize password history if it doesn't exist
    if (!user.passwordHistory) {
      user.passwordHistory = []
    }

    // Then check if it matches any password in history
    const isPasswordReused = await checkPasswordHistory(newPassword, user)
    if (isPasswordReused) {
      return res.status(400).json({
        error: 'Your new password cannot be the same as any of your last 5 passwords'
      })
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Add current password to history before updating it
    // Keep only the last 5 passwords in history
    user.passwordHistory.push(user.password)
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(-5)
    }

    // Update the password
    user.password = hashedNewPassword
    await user.save()

    // If user has 2FA enabled, we might want to revoke existing trusted devices for security
    if (user.twoFA?.enabled) {
      user.trustedDevices = []
      await user.save()
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return res.status(500).json({ error: 'An error occurred while changing the password' })
  }
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

// Check if password exists in history
async function checkPasswordHistory(newPassword: string, user: UserWithPasswordHistory): Promise<boolean> {
  if (!user.passwordHistory || user.passwordHistory.length === 0) {
    return false
  }

  // Check each password in history
  for (const oldPassword of user.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, oldPassword)
    if (isMatch) return true
  }

  return false
} 