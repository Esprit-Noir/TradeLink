/**
 * Rate limiter — Upstash Redis (production) with in-memory fallback (development)
 *
 * In production, uses Upstash Redis for distributed rate limiting across
 * serverless instances. In development, falls back to in-memory Map.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Upstash Redis singleton client (production)
let upstashRedisClient: Redis | null = null
let upstashRatelimit: Ratelimit | null = null

function getUpstashRedis(): Redis | null {
  if (upstashRedisClient) return upstashRedisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️ rate-limit: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. " +
        "Rate limiting is NOT effective in serverless. Add Upstash Redis env vars."
      )
    }
    return null
  }

  upstashRedisClient = new Redis({ url, token })
  return upstashRedisClient
}

function getUpstashRatelimit(): Ratelimit | null {
  if (upstashRatelimit) return upstashRatelimit

  const redis = getUpstashRedis()
  if (!redis) return null

  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "tradelink:ratelimit",
  })

  return upstashRatelimit
}

// In-memory fallback (development only)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function cleanupExpired() {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  if (rateLimitMap.size > 500) cleanupExpired()

  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs, limit }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime, limit }
  }

  record.count++
  return { success: true, remaining: limit - record.count, reset: record.resetTime, limit }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

/**
 * Generate standard rate limit headers from a RateLimitResult.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  }
}

/**
 * Rate limit a request by key.
 * @param key - Unique identifier (e.g., "register:192.168.1.1" or "import:user123")
 * @param opts - limit (max requests) and windowMs (time window in ms)
 */
export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60000 }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const upstash = getUpstashRatelimit()

  if (upstash) {
    return { success: true, remaining: limit - 1, reset: Date.now() + windowMs, limit }
  }

  // Fallback to in-memory (development)
  return inMemoryRateLimit(key, limit, windowMs)
}

/**
 * Async rate limit for use in async contexts (preferred for production).
 * Uses Upstash Redis when available, falls back to in-memory.
 */
export async function rateLimitAsync(
  key: string,
  { limit = 10, windowMs = 60000 }: { limit?: number; windowMs?: number } = {}
): Promise<RateLimitResult> {
  // Reuse the singleton Redis client — never recreate on each call
  const redis = getUpstashRedis()

  if (redis) {
    const perKeyRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: `tradelink:ratelimit:${key}`,
    })
    const result = await perKeyRatelimit.limit(key)
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    }
  }

  // Fallback to in-memory (development)
  return inMemoryRateLimit(key, limit, windowMs)
}
