import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

// Ensure DATABASE_URL is available (it should be injected by Next.js via .env.local)
const connectionString = process.env.DATABASE_URL!

// Setup the PostgreSQL connection pool
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const base = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

type ExtendedPrismaClient = ReturnType<typeof extendPrisma>

// Apply the backtest exclusion to a generic (non-unique) where clause.
function withLiveOnlyFilter(
  where: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const { includeBacktest, ...rest } = (where ?? {}) as {
    includeBacktest?: boolean
  } & Record<string, unknown>
  
  if (!includeBacktest) {
    return { ...rest, source: { not: "backtest" } }
  }
  
  return rest
}

type ArgsWithWhere = { where?: Record<string, unknown> }

async function wrap<T extends object, R>(
  args: T,
  query: (args: T) => Promise<R>,
): Promise<R> {
  const cast = args as unknown as ArgsWithWhere
  cast.where = withLiveOnlyFilter(cast.where)
  return query(args)
}

// Extend the client so every trade query excludes `source: "backtest"` by default.
// This keeps backtest trades out of all existing stats (dashboard, trades, metrics,
// reports, risk...) without touching each query site.
// Opt out by passing `includeBacktest: true` inside `where` — it is stripped before
// hitting the database.
// NOTE: only generic-where operations are filtered. Unique-where operations
// (findUnique / update / delete / upsert) are left untouched because Prisma's
// WhereUniqueInput rejects AND-wrapped clauses.
function extendPrisma(client: PrismaClient) {
  return client.$extends({
    query: {
      trade: {
        async findMany({ args, query }) {
          return wrap(args, query)
        },
        async findFirst({ args, query }) {
          return wrap(args, query)
        },
        async findFirstOrThrow({ args, query }) {
          return wrap(args, query)
        },
        async count({ args, query }) {
          return wrap(args, query)
        },
        async aggregate({ args, query }) {
          return wrap(args, query)
        },
        async groupBy({ args, query }) {
          return wrap(args, query)
        },
        async updateMany({ args, query }) {
          return wrap(args, query)
        },
        async deleteMany({ args, query }) {
          return wrap(args, query)
        },
      },
    },
  })
}

export const prisma =
  globalForPrisma.prisma ?? extendPrisma(base)

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
