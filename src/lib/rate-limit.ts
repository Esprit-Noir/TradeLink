/**
 * Rate limiter — in-memory (développement / mono-instance uniquement)
 *
 * ⚠️  LIMITATION SERVERLESS : en production sur Vercel, chaque fonction
 *     tourne dans son propre isolat. Ce compteur est LOCAL à chaque instance
 *     et ne se partage PAS entre les workers concurrents.
 *
 * ✅  Pour la production, migrer vers Upstash Redis :
 *     https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *     `import { Ratelimit } from "@upstash/ratelimit"`
 *
 * Note : le setInterval() original a été supprimé — il empêche le garbage
 * collector de libérer les modules dans les environnements serverless et
 * déclenche des warnings de fuite mémoire dans Next.js.
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Nettoyage paresseux (lazy GC) à chaque appel — pas de timer global
function cleanupExpired() {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  // Nettoyage périodique — seulement si la Map est grande (évite la boucle à chaque requête)
  if (rateLimitMap.size > 500) cleanupExpired()

  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: limit - record.count }
}
