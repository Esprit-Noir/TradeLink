import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { accountId } = await req.json()
    
    if (!accountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 })
    }

    const cookieStore = await cookies()
    // Set cookie valid for 30 days
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
