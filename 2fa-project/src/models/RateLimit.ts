import mongoose from 'mongoose'

// Define the schema
const RateLimitSchema = new mongoose.Schema({
  // User ID or identifier
  userId: {
    type: String,
    required: true,
    index: true
  },
  // The API endpoint or action being rate limited
  endpoint: {
    type: String,
    required: true
  },
  // Number of attempts
  count: {
    type: Number,
    default: 1
  },
  // When the rate limit window resets
  resetTime: {
    type: Date,
    required: true
  },
  // When this record was created
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h' // Auto-expire old records after 1 hour
  }
}, {
  // Add timestamps for when the document was created/updated
  timestamps: true
})

// Create a compound index for userId + endpoint
RateLimitSchema.index({ userId: 1, endpoint: 1 }, { unique: true })

// Check if the model already exists to prevent model overwrite error
export const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema) 