"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function ROINotification() {
  const fired = useRef(false)
  
  useEffect(() => {
    if (fired.current) return
    fired.current = true

    fetch("/api/prop-firms/report")
      .then(r => r.json())
      .then(report => {
        if (report && report.totalCost > 0) {
          const isPositive = (report.roi ?? 0) >= 0;
          const roiText = isPositive ? `+${report.roi}%` : `${report.roi}%`;
          const roiSuffix = isPositive ? "" : " (still in the red)";
          const message = `You spent $${report.totalCost.toLocaleString("en-US", { minimumFractionDigits: 0 })} on challenges and received $${report.payoutsPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })} in payouts — net ${roiText} ROI${roiSuffix}.`;
          const options = {
            description: "Set the challenge cost when creating or editing a challenge to refine this.",
            duration: 8000,
          };
          
          if (isPositive) {
            toast.success(message, {
              ...options,
              style: { color: "var(--color-profit)", borderColor: "rgba(0, 199, 88, 0.3)", background: "rgba(0, 199, 88, 0.05)" }
            })
          } else {
            toast.error(message, {
              ...options,
              style: { color: "var(--color-loss)", borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }
            })
          }
        }
      })
      .catch(() => {})
  }, [])

  return null
}
