import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const densitySchema = z.object({
  density: z.enum(["comfortable", "compact"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = densitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { density } = parsed.data

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
    console.error("[PREFS_DENSITY]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
