import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { density } = await req.json()
    if (density !== "comfortable" && density !== "compact") {
      return NextResponse.json({ error: "Invalid density value" }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set("ui_density", density, {
      httpOnly: false, // false so client components could potentially read it if needed, or we just rely on server components
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    })

    return NextResponse.json({ success: true, density })
  } catch (error) {
    console.error("[PREFS_DENSITY]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
