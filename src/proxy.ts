import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_ROUTES = ["/login", "/register", "/", "/marketing"]

const PUBLIC_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".css", ".js", ".map", ".woff", ".woff2", ".ttf", ".eot"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    PUBLIC_ROUTES.some((r) => pathname === r) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    PUBLIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  })

  // No session → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const role = token.role as string | undefined
    const status = token.status as string | undefined

    // Block suspended/banned users
    if (status === "SUSPENDED" || status === "BANNED") {
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.set("admin_error", "account_disabled", { maxAge: 5 })
      return response
    }

    // Block non-admin users
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      const response = NextResponse.redirect(new URL("/", request.url))
      response.cookies.set("admin_error", "unauthorized", { maxAge: 5 })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
