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
    max: 10, // augmenté car on partage une seule instance
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Alias partagé pour NextAuth — même instance, pas de double pool
export const authPrisma = prisma
