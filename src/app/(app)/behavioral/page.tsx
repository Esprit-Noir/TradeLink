import { BehaviorScore } from "@/components/behavioral/BehaviorScore"

export const metadata = {
  title: "Behavioral Analysis",
}

export default function BehavioralPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Behavioral Analysis</h1>
          <p className="page-subtitle">AI-driven insights into your trading psychology and discipline.</p>
        </div>
      </div>
      
      <div style={{ maxWidth: 800 }}>
        <BehaviorScore />
      </div>
    </div>
  )
}
