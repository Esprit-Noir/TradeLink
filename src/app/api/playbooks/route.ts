export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const playbookSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  entryRules: z.any().optional(),
  exitRules: z.any().optional(),
  riskRules: z.any().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const playbooks = await prisma.playbook.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ data: playbooks })
  } catch (error) {
    console.error("[PLAYBOOKS_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = playbookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
    }

    const playbook = await prisma.playbook.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        description: parsed.data.description,
        tags: parsed.data.tags ?? [],
        entryRules: parsed.data.entryRules,
        exitRules: parsed.data.exitRules,
        riskRules: parsed.data.riskRules,
      },
    })

    return NextResponse.json({ data: playbook }, { status: 201 })
  } catch (error) {
    console.error("[PLAYBOOKS_POST]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
