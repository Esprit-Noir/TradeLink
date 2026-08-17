import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL!

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 60000,
    max: 5,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Separate PrismaClient for NextAuth
const globalForAuthPrisma = globalThis as unknown as {
  authPrisma: PrismaClient | undefined
}

const authPrismaSingleton = () => {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 60000,
    max: 5,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const authPrisma = globalForAuthPrisma.authPrisma ?? authPrismaSingleton()

if (process.env.NODE_ENV !== "production") globalForAuthPrisma.authPrisma = authPrisma
