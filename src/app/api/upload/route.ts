import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const ALLOWED_EXTENSIONS = [".csv", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf"]
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    const ext = path.extname(filename).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      )
    }

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 })
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {}

    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = path.join(uploadDir, uniqueFilename)
    
    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${uniqueFilename}` })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
