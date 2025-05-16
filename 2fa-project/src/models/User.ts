import mongoose, { Document, Model } from 'mongoose'

interface ITrustedDevice {
  token: string
  expires: Date
}

interface IRecoveryCode {
  code: string
  used: boolean
}

export interface IUser extends Document {
  email: string
  password: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
  verificationToken?: string
  verificationTokenExpiry?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  twoFA?: {
    secret: string
    enabled: boolean
    recoveryCodes?: IRecoveryCode[]
  }
  trustedDevices?: ITrustedDevice[]
}

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const UserSchema = new mongoose.Schema<IUser>({
  email: { 
    type: String, 
    unique: true, 
    required: [true, 'Email is required'],
    match: [emailRegex, 'Please provide a valid email address'],
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  firstName: { 
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: { 
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  twoFA: {
    secret: String,
    enabled: { type: Boolean, default: false },
    recoveryCodes: [
      {
        code: String, // This will store the hashed recovery code
        used: { type: Boolean, default: false }
      }
    ]
  },
  trustedDevices: [
    {
      token: String,
      expires: Date,
    },
  ],
})

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model('User', UserSchema)
