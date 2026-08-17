import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CalculatorClient } from "@/components/calculator/CalculatorClient"

export const metadata = {
  title: "Position Calculator",
}

export default async function CalculatorPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Position Calculator</h1>
          <p className="page-subtitle">Calculate your position size based on risk management rules</p>
        </div>
      </div>
      <CalculatorClient />
    </div>
  )
}
