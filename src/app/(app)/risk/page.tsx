import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RiskManager } from "@/components/risk/RiskManager"

export const metadata = {
  title: "Risk Management",
}

export default async function RiskPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div>
      <RiskManager />
    </div>
  )
}
