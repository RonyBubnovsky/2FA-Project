import { RateLimit } from '../models/RateLimit';

/**
 * Configuration for rate limiting
 */
export const RATE_LIMIT_MAX = 5; // Max 5 attempts
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Checks if a user has exceeded the rate limit for a specific endpoint
 * @param userId The ID of the user to check
 * @param endpoint The name of the endpoint being rate limited
 * @returns Promise<boolean> True if rate limited, false otherwise
 */
export async function isRateLimited(userId: string, endpoint: string): Promise<boolean> {
  const now = new Date();
  
  try {
    // Find or create rate limit record
    const rateLimitRecord = await RateLimit.findOne({
      userId: userId,
      endpoint: endpoint
    });
    
    // If no record exists or the window has expired, create/reset the record
    if (!rateLimitRecord || now > rateLimitRecord.resetTime) {
      // If there was an old record, update it
      if (rateLimitRecord) {
        rateLimitRecord.count = 1;
        rateLimitRecord.resetTime = new Date(now.getTime() + RATE_LIMIT_WINDOW);
        await rateLimitRecord.save();
      } else {
        // Create new record
        await RateLimit.create({
          userId: userId,
          endpoint: endpoint,
          count: 1,
          resetTime: new Date(now.getTime() + RATE_LIMIT_WINDOW)
        });
      }
      return false;
    }
    
    // Increment count
    rateLimitRecord.count += 1;
    await rateLimitRecord.save();
    
    // Check if over limit
    if (rateLimitRecord.count <= RATE_LIMIT_MAX) {
      return false;
    }
    
    // Over limit, deny the request
    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // In case of database error, allow the request (fail open for usability)
    return false;
  }
}

/**
 * Resets the rate limit for a user on a specific endpoint
 * @param userId The ID of the user
 * @param endpoint The name of the endpoint
 * @returns Promise<void>
 */
export async function resetRateLimit(userId: string, endpoint: string): Promise<void> {
  try {
    await RateLimit.deleteOne({ userId: userId, endpoint: endpoint });
  } catch (error) {
    console.error('Rate limit reset error:', error);
    // Non-critical error, can be ignored
  }
} 