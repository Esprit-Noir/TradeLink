import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await requireAdmin()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "20")
  const status = searchParams.get("status") || ""

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        assignedAdmin: { select: { id: true, email: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supportTicket.count({ where }),
  ])

  return NextResponse.json({ tickets, total, page, pageSize })
}
