import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BehaviorScore } from "@/components/behavioral/BehaviorScore"

export const metadata = {
  title: "Behavioral Analysis",
}

export default async function BehavioralPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Behavioral Analysis</h1>
          <p className="page-subtitle">AI-driven insights into your trading psychology and discipline.</p>
        </div>
      </div>
      
      <div>
        <BehaviorScore />
      </div>
    </div>
  )
}
