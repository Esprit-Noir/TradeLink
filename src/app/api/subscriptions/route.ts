import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const subscribeSchema = z.object({
  planId: z.string().min(1),
  cryptoTxId: z.string().min(1).max(200),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { planId, cryptoTxId } = parsed.data

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 })
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId,
        status: "PENDING",
        cryptoTxId,
        cryptoAddress: process.env.CRYPTO_PAYMENT_ADDRESS || "T9yD14Nj9j7xAB4dbGeiX9h8unkgU4mQY9",
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    console.error("Subscription Error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
