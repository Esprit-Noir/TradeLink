import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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
  } catch (error) {
    console.error("Admin Get Tickets Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
