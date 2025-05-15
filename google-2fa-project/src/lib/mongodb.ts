import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Define MONGODB_URI in .env.local')
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as {mongoose?: MongooseCache}).mongoose || { conn: null, promise: null }

if (!cached) {
  cached = (global as {mongoose?: MongooseCache}).mongoose = { conn: null, promise: null }
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI!).then(m => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}
