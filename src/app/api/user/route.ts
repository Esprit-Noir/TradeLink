import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, baseCurrency, timezone, dailyGoal } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(baseCurrency !== undefined && { baseCurrency }),
        ...(timezone !== undefined && { timezone }),
        ...(dailyGoal !== undefined && { dailyGoal }),
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("[USER_UPDATE]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
