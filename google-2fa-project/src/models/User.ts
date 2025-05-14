import mongoose, { Document, Model } from 'mongoose'

interface ITrustedDevice {
  token: string
  expires: Date
}

export interface IUser extends Document {
  email: string
  password: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
  verificationToken?: string
  verificationTokenExpiry?: Date
  twoFA?: {
    secret: string
    enabled: boolean
  }
  trustedDevices?: ITrustedDevice[]
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpiry: Date,
  twoFA: {
    secret: String,
    enabled: { type: Boolean, default: false },
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
