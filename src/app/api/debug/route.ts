import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const c = await prisma.propChallenge.findMany({ include: { account: true } })
  const snaps = await prisma.propChallengeDailySnapshot.findMany()
  return NextResponse.json({ challenges: c, snapshots: snaps })
}
