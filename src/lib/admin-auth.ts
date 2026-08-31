import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

export type AdminSession = {
  user: {
    id: string
    email: string
    name: string | null
    role: string
    status: string
  }
}

/**
 * Require admin role. Redirects to / if not authorized.
 * Also checks for suspended/banned status.
 * Use for Server Components only — for API routes, use requireAdminApi().
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Check status
  const status = (session.user as Record<string, unknown>).status as string
  if (status === "SUSPENDED" || status === "BANNED") {
    redirect("/login?error=account_disabled")
  }

  // Check role
  const role = (session.user as Record<string, unknown>).role as string
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/?error=unauthorized")
  }

  return session as unknown as AdminSession
}

/**
 * Require admin role for API routes. Returns NextResponse on error, AdminSession on success.
 * Use this in Route Handlers instead of requireAdmin() to get proper JSON error responses.
 */
export async function requireAdminApi(): Promise<NextResponse | AdminSession> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check status
  const status = (session.user as Record<string, unknown>).status as string
  if (status === "SUSPENDED" || status === "BANNED") {
    return NextResponse.json({ error: "Account disabled" }, { status: 403 })
  }

  // Check role
  const role = (session.user as Record<string, unknown>).role as string
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return session as unknown as AdminSession
}

/**
 * Check if current user is SUPER_ADMIN. Use for Server Components.
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdmin()

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/?error=unauthorized")
  }

  return session
}

/**
 * Check if current user is SUPER_ADMIN for API routes.
 */
export async function requireSuperAdminApi(): Promise<NextResponse | AdminSession> {
  const session = await requireAdminApi()

  // If it's a NextResponse, it means auth failed — return it
  if (session instanceof NextResponse) {
    return session
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return session
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(params: {
  adminId: string
  targetUserId?: string
  action: string
  reason?: string
  metadata?: Record<string, unknown>
}) {
  return prisma.adminActionLog.create({
    data: {
      adminId: params.adminId,
      targetUserId: params.targetUserId || null,
      action: params.action,
      reason: params.reason || null,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  })
}
