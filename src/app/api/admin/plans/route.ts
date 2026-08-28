import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi } from "@/lib/admin-auth"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  maxAccounts: z.number().int().min(1).max(100).optional(),
  maxTradesPerMonth: z.number().int().min(1).optional().nullable(),
  backtestAccess: z.boolean().optional(),
  isActive: z.boolean().optional(),
  features: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: Request) {
  try {
    const sessionOrResponse = await requireAdminApi()
    if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

    const body = await req.json()
    const parsed = createPlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, price, maxAccounts, maxTradesPerMonth, backtestAccess, isActive, features } = parsed.data

    const plan = await prisma.plan.create({
      data: {
        name,
        price,
        maxAccounts: maxAccounts || 1,
        maxTradesPerMonth: maxTradesPerMonth || null,
        backtestAccess: !!backtestAccess,
        isActive: isActive !== false,
        features: (features as Prisma.InputJsonValue) || {},
      }
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error("Create Plan Error:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}
