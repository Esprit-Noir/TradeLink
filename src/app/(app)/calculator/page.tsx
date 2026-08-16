import { CalculatorClient } from "@/components/calculator/CalculatorClient"

export const metadata = {
  title: "Position Calculator",
}

export default function CalculatorPage() {
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
