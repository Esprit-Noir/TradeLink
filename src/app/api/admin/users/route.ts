import { NextResponse } from "next/server"
import { requireAdminApi, logAdminAction } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const PATCHSchema = z.object({
  userId: z.string(),
  action: z.enum(["change_role", "suspend", "activate", "ban", "delete"]),
  reason: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["createdAt", "email", "name", "role", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export async function GET(request: Request) {
  try {
    const sessionOrResponse = await requireAdminApi()
    if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

    const { searchParams } = new URL(request.url)
    const parsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      status: searchParams.get("status") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { page, pageSize, search, role, status, sortBy, sortOrder } = parsed.data

    const where: Record<string, unknown> = { deletedAt: null }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ]
    }

    if (role) where.role = role
    if (status) where.status = status

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { accounts: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, pageSize })
  } catch (error) {
    console.error("Admin Get Users Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionOrResponse = await requireAdminApi()
    if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
    const session = sessionOrResponse
    const body = await request.json()
    const parsed = PATCHSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { userId, action, reason, role } = parsed.data

    // Cannot modify yourself (except role change to self)
    if (userId === session.user.id && action !== "change_role") {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
    }

    // Fetch target user
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if target is SUPER_ADMIN and current user is not SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot modify SUPER_ADMIN" }, { status: 403 })
    }

    let updateData: Record<string, unknown> = {}
    let logAction = ""

    switch (action) {
      case "change_role":
        if (!role) {
          return NextResponse.json({ error: "Role is required" }, { status: 400 })
        }
        // ADMIN cannot promote to SUPER_ADMIN
        if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
          return NextResponse.json({ error: "Only SUPER_ADMIN can promote to SUPER_ADMIN" }, { status: 403 })
        }
        updateData = { role }
        logAction = "ROLE_CHANGED"
        break

      case "suspend":
        updateData = { status: "SUSPENDED", tokenVersion: { increment: 1 } }
        logAction = "USER_SUSPENDED"
        break

      case "activate":
        updateData = { status: "ACTIVE" }
        logAction = "USER_ACTIVATED"
        break

      case "ban":
        updateData = { status: "BANNED", tokenVersion: { increment: 1 } }
        logAction = "USER_BANNED"
        break

      case "delete":
        updateData = { deletedAt: new Date(), tokenVersion: { increment: 1 } }
        logAction = "USER_DELETED"
        break
    }

    await prisma.user.update({ where: { id: userId }, data: updateData })

    await logAdminAction({
      adminId: session.user.id,
      targetUserId: userId,
      action: logAction,
      reason,
      metadata: { previousRole: targetUser.role, newRole: role },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin Patch User Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
