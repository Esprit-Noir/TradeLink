import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email." }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user and a default trading account in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })

      await tx.tradingAccount.create({
        data: {
          userId: newUser.id,
          name: "Main Account",
          baseCurrency: "USD",
          initialBalance: 10000,
          isDefault: true,
        },
      })

      return newUser
    })

    return NextResponse.json({ id: user.id, email: user.email, name: user.name })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}
