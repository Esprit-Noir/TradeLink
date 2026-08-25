export const MS_PER_DAY = 86_400_000
export const DEFAULT_BALANCE = 10_000
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024

/**
 * Constantes de domaine — valeurs de statut pour les modèles Prisma
 *
 * Ces champs sont actuellement stockés en String dans la DB.
 * Ces constantes offrent une protection contre les typos dans le code TypeScript
 * en attendant la migration vers des enums Prisma natifs.
 *
 * Migration à faire (non destructive) :
 * 1. CREATE TYPE trade_status AS ENUM ('open', 'closed')
 * 2. ALTER TABLE trades ALTER COLUMN status TYPE trade_status USING status::trade_status
 * 3. Répéter pour prop_challenges.phase, prop_challenges.status, prop_payouts.status
 * 4. ALTER TABLE daily_journals ALTER COLUMN date TYPE date USING date::date
 * 5. Mettre à jour prisma/schema.prisma avec les enums et DateTime @db.Date pour le journal
 * 6. npx prisma generate
 */

// ─── Trade ───────────────────────────────────────────────────────────────────
export const TradeStatus = {
  OPEN: "open",
  CLOSED: "closed",
} as const

export type TradeStatusType = (typeof TradeStatus)[keyof typeof TradeStatus]

// ─── PropChallenge ────────────────────────────────────────────────────────────
export const ChallengeStatus = {
  ACTIVE: "active",
  PASSED: "passed",
  FAILED: "failed",
  BREACHED: "breached",
} as const

export type ChallengeStatusType = (typeof ChallengeStatus)[keyof typeof ChallengeStatus]

export const ChallengePhase = {
  PHASE_1: "phase_1",
  PHASE_2: "phase_2",
  FUNDED: "funded",
  FAILED: "failed",
} as const

export type ChallengePhaseType = (typeof ChallengePhase)[keyof typeof ChallengePhase]

// ─── PropPayout ───────────────────────────────────────────────────────────────
export const PayoutStatus = {
  REQUESTED: "requested",
  APPROVED: "approved",
  PAID: "paid",
  REJECTED: "rejected",
} as const

export type PayoutStatusType = (typeof PayoutStatus)[keyof typeof PayoutStatus]
