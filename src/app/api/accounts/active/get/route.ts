import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ activeAccountId: null })

    const cookieStore = await cookies()
    const activeAccountId = cookieStore.get("activeAccountId")?.value

    if (activeAccountId) {
      return NextResponse.json({ activeAccountId })
    }

    // Fallback to default
    const account = await prisma.tradingAccount.findFirst({
      where: { userId: session.user.id, isDefault: true },
      select: { id: true }
    })

    return NextResponse.json({ activeAccountId: account?.id || null })
  } catch (error) {
    return NextResponse.json({ activeAccountId: null })
  }
}
