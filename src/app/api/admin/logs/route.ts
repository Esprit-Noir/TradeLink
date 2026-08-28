import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(request: Request) {
  try {
    const sessionOrResponse = await requireAdminApi()
    if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid pagination", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { page, pageSize } = parsed.data
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
  } catch (error) {
    console.error("Admin Get Logs Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
