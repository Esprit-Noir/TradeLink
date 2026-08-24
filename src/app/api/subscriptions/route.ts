import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId, cryptoTxId } = await req.json()

    if (!planId || !cryptoTxId) {
      return NextResponse.json({ error: "Missing plan or transaction ID" }, { status: 400 })
    }

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
        cryptoAddress: "T9yD14Nj9j7xAB4dbGeiX9h8unkgU4mQY9", // Hardcoded MVP address
      }
    })

    return NextResponse.json({ success: true, subscription })
  } catch (error: any) {
    console.error("Subscription Error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
