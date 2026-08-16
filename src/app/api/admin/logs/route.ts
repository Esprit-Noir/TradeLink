import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await requireAdmin()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "50")
  const action = searchParams.get("action") || ""
  const adminId = searchParams.get("adminId") || ""

  const where: Record<string, unknown> = {}
  if (action) where.action = action
  if (adminId) where.adminId = adminId

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      include: {
        admin: { select: { id: true, email: true, name: true } },
        targetUser: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminActionLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pageSize })
}
