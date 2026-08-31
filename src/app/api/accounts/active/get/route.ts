import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getActiveAccount } from "@/lib/active-account"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ activeAccountId: null })

    const account = await getActiveAccount(session.user.id)
    return NextResponse.json({ activeAccountId: account?.id || null })
  } catch {
    return NextResponse.json({ activeAccountId: null })
  }
}
