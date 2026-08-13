import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PayoutsManager } from "@/components/prop-firm/PayoutsManager"

export const metadata = {
  title: "Payouts",
}

export default async function PayoutsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div>
      <PayoutsManager />
    </div>
  )
}
