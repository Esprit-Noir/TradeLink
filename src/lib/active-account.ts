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
      }
    })
  }

  return account
}
