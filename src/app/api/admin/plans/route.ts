import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await req.json()
    const { name, price, maxAccounts, maxTradesPerMonth, backtestAccess, isActive, features } = json

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        price,
        maxAccounts: maxAccounts || 1,
        maxTradesPerMonth: maxTradesPerMonth || null,
        backtestAccess: !!backtestAccess,
        isActive: isActive !== false,
        features: features || {},
      }
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error("Create Plan Error:", error)
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 })
  }
}
