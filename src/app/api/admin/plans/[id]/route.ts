import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const json = await req.json()
    const { name, price, maxAccounts, maxTradesPerMonth, backtestAccess, isActive, features } = json

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price }),
        ...(maxAccounts !== undefined && { maxAccounts }),
        ...(maxTradesPerMonth !== undefined && { maxTradesPerMonth }),
        ...(backtestAccess !== undefined && { backtestAccess }),
        ...(isActive !== undefined && { isActive }),
        ...(features !== undefined && { features }),
      }
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error("Update Plan Error:", error)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !session.user || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.plan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete Plan Error:", error)
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
