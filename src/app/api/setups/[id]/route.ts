import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await req.json()
    const { name, description, isDefault } = data

    // Verify ownership
    const setup = await prisma.tradingSetup.findUnique({ where: { id } })
    if (!setup || setup.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // If setting as default, we need to unset all others first
    if (isDefault) {
      await prisma.tradingSetup.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.tradingSetup.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating setup", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Verify ownership
    const setup = await prisma.tradingSetup.findUnique({ where: { id } })
    if (!setup || setup.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.tradingSetup.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting setup", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
