import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Retrieves the currently active account for the given user.
 * It reads the `activeAccountId` cookie. If not found, it falls back to the default account.
 * 
 * NOTE: This function reads cookies and must be used inside Server Components or Server Actions.
 */
export async function getActiveAccount(userId: string) {
  const cookieStore = await cookies()
  const activeAccountId = cookieStore.get("activeAccountId")?.value

  let account = null

  if (activeAccountId) {
    account = await prisma.tradingAccount.findFirst({
      where: {
        id: activeAccountId,
        userId: userId,
      }
    })
  }

  // Fallback to default account if cookie is missing or account not found
  if (!account) {
    account = await prisma.tradingAccount.findFirst({
      where: {
        userId: userId,
        isDefault: true,
        type: { not: "backtest" },
      }
    })
  }

  return account
}

/**
 * Resolves the account to use for a widget.
 * - If `accountId` is provided, verifies it belongs to the user and returns it.
 * - Otherwise falls back to `getActiveAccount` (cookie/default).
 */
export async function resolveAccount(userId: string, accountId?: string | null) {
  if (accountId) {
    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId },
    })
    if (account) return account
  }
  return getActiveAccount(userId)
}

/**
 * Resolves the account scope for dashboard widgets.
 * - `accountId === "all"` or undefined/null → aggregated across every account of the user (including backtest).
 * - otherwise → a single account (or the active one).
 */
export async function resolveAccountScope(userId: string, accountId?: string | null | "all") {
  if (!accountId || accountId === "all") {
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId },
    })
    const defaultAcct = accounts.find(a => a.isDefault) || accounts[0] || null
    return {
      all: true as const,
      accounts,
      currency: defaultAcct?.baseCurrency ?? "USD",
      baseBalance: accounts.reduce((s, a) => s + Number(a.initialBalance ?? 0), 0),
    }
  }
  const account = await resolveAccount(userId, accountId)
  return {
    all: false as const,
    accounts: account ? [account] : [],
    currency: account?.baseCurrency ?? "USD",
    baseBalance: Number(account?.initialBalance ?? 0),
  }
}
