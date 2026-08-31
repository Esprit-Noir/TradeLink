import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { rateLimitAsync, rateLimitHeaders } from "@/lib/rate-limit"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  try {
    // Rate limit: 5 attempts per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rl = await rateLimitAsync(`register:${ip}`, { limit: 5, windowMs: 60000 })
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter), ...rateLimitHeaders(rl) } }
      )
    }

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

    // Send Welcome Email asynchronously (don't block the response)
    import("@/lib/email").then(({ sendEmail }) => {
      import("@/emails/WelcomeEmail").then(({ WelcomeEmail }) => {
        sendEmail({
          to: user.email,
          subject: "Welcome to TradeLink 🚀",
          react: WelcomeEmail({ userName: user.name || "Trader" }),
        }).catch(console.error)
      })
    }).catch(console.error)

    return NextResponse.json({ id: user.id, email: user.email, name: user.name })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
