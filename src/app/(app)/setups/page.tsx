import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SetupsManager } from "@/components/setups/SetupsManager"

export const metadata = {
  title: "Trading Setups",
}

export default async function SetupsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div>
      <SetupsManager />
    </div>
  )
}
