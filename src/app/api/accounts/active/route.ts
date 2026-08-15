import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { accountId } = await req.json()
    
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 })
    }

    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: session.user.id },
      select: { id: true },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const cookieStore = await cookies()
    cookieStore.set("activeAccountId", accountId, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ACTIVE_ACCOUNT_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
