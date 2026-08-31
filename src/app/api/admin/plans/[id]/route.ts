import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminApi } from "@/lib/admin-auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdminApi()
    if (authResult instanceof NextResponse) return authResult

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
  } catch (error) {
    console.error("Update Plan Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdminApi()
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    await prisma.plan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete Plan Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 })
  }
}
