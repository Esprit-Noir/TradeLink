import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

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
 * Check if current user is SUPER_ADMIN
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdmin()

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/?error=unauthorized")
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
      metadata: (params.metadata as any) || undefined,
    },
  })
}
