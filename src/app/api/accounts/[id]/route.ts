import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Prisma } from "@prisma/client"

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  initialBalance: z.string().or(z.number()).optional(),
  isDefault: z.boolean().optional(),
  fxRateToUsd: z.string().or(z.number()).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: accountId } = await params
    const body = await request.json()
    const parsed = updateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, initialBalance, isDefault, fxRateToUsd } = parsed.data

    // Ensure account belongs to user
    const account = await prisma.tradingAccount.findUnique({
      where: { id: accountId }
    })

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.tradingAccount.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      })
    }

    const dataToUpdate: Prisma.TradingAccountUpdateInput = {}
    if (name !== undefined) dataToUpdate.name = name
    if (initialBalance !== undefined) {
      const v = parseFloat(String(initialBalance))
      dataToUpdate.initialBalance = isNaN(v) ? 0 : v
    }
    if (isDefault !== undefined) dataToUpdate.isDefault = isDefault
    if (fxRateToUsd !== undefined) {
      const v = parseFloat(String(fxRateToUsd))
      dataToUpdate.fxRateToUsd = isNaN(v) ? 1 : v
    }

    const updatedAccount = await prisma.tradingAccount.update({
      where: { id: accountId },
      data: dataToUpdate
    })

    // Recompute netPnlUsd for all closed trades when the FX rate changes
    if (fxRateToUsd !== undefined) {
      const rate = parseFloat(String(fxRateToUsd))
      if (isNaN(rate)) return NextResponse.json(updatedAccount)
      const trades = await prisma.trade.findMany({
        where: { accountId: accountId, netPnl: { not: null } },
        select: { id: true, netPnl: true },
      })
      await prisma.$transaction(
        trades.map((t) =>
          prisma.trade.update({
            where: { id: t.id },
            data: { netPnlUsd: Math.round(Number(t.netPnl) * rate * 10000) / 10000 },
          })
        )
      )
    }

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error("Error updating account:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: accountId } = await params

    const account = await prisma.tradingAccount.findUnique({
      where: { id: accountId }
    })

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Prevent deleting the last account
    const count = await prisma.tradingAccount.count({
      where: { userId: session.user.id }
    })

    if (count <= 1) {
      return NextResponse.json({ error: "Cannot delete your only trading account." }, { status: 400 })
    }

    await prisma.tradingAccount.delete({
      where: { id: accountId }
    })

    // If we deleted the default, set another one as default
    if (account.isDefault) {
      const firstRemaining = await prisma.tradingAccount.findFirst({
        where: { userId: session.user.id }
      })
      if (firstRemaining) {
        await prisma.tradingAccount.update({
          where: { id: firstRemaining.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
