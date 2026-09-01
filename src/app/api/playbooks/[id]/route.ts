export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updatePlaybookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  entryRules: z.any().optional(),
  exitRules: z.any().optional(),
  riskRules: z.any().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const playbook = await prisma.playbook.findFirst({ where: { id, userId: session.user.id } })
    if (!playbook) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ data: playbook })
  } catch (error) {
    console.error("[PLAYBOOK_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const existing = await prisma.playbook.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = updatePlaybookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 })
    }

    const playbook = await prisma.playbook.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ data: playbook })
  } catch (error) {
    console.error("[PLAYBOOK_PATCH]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const existing = await prisma.playbook.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.playbook.delete({ where: { id } })
    return NextResponse.json({ data: { ok: true } })
  } catch (error) {
    console.error("[PLAYBOOK_DELETE]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
