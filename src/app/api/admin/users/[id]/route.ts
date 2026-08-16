import { NextResponse } from "next/server"
import { requireAdmin, logAdminAction } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      deletedAt: true,
      _count: {
        select: {
          accounts: true,
          backtestSessions: true,
          dailyJournals: true,
        },
      },
      accounts: {
        select: { id: true, name: true, broker: true, type: true },
      },
      adminActionLogs: {
        where: { targetUserId: id },
        include: { admin: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  const { id } = await params
  const body = await request.json()

  if (body.action !== "impersonate") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  // Only SUPER_ADMIN can impersonate
  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can impersonate" }, { status: 403 })
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Log impersonation
  await logAdminAction({
    adminId: session.user.id,
    targetUserId: id,
    action: "IMPERSONATION_STARTED",
    reason: body.reason,
    metadata: { targetEmail: targetUser.email },
  })

  // Create impersonation token (30 min expiry)
  const expires = new Date(Date.now() + 30 * 60 * 1000)

  // Set impersonation cookie
  const response = NextResponse.json({
    success: true,
    impersonate: {
      userId: id,
      email: targetUser.email,
      expires: expires.toISOString(),
    },
  })

  // Set a cookie that the middleware can read
  response.cookies.set("admin_impersonate", JSON.stringify({
    userId: id,
    adminId: session.user.id,
    expires: expires.toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  })

  return response
}
