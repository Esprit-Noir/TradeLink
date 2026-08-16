import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseCurrency: z.string().length(3).optional(),
  timezone: z.string().max(50).optional(),
  dailyGoal: z.number().min(0).optional(),
  monthlyGoal: z.number().min(0).optional(),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, baseCurrency, timezone, dailyGoal, monthlyGoal } = parsed.data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(baseCurrency !== undefined && { baseCurrency }),
        ...(timezone !== undefined && { timezone }),
        ...(dailyGoal !== undefined && { dailyGoal }),
        ...(monthlyGoal !== undefined && { monthlyGoal }),
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("[USER_UPDATE]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
