"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Prisma } from "@prisma/client"
import { PlanForm } from "./PlanForm"

type Plan = {
  id: string
  name: string
  price: number | string
  maxAccounts: number
  maxTradesPerMonth: number | null
  backtestAccess: boolean
  isActive: boolean
  features?: Prisma.JsonValue | null
}

function featureFlag(features: Prisma.JsonValue | null | undefined, key: string): boolean {
  return typeof features === "object" && features !== null && !Array.isArray(features)
    ? Boolean(Reflect.get(features, key))
    : false
}

export function PlansManager({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setPlans(plans.filter(p => p.id !== id))
      toast.success("Plan deleted")
    } catch (e: unknown) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Create New Plan
        </button>
      </div>

      {(isCreating || editingPlan) && (
        <PlanForm 
          plan={editingPlan}
          onClose={() => {
            setIsCreating(false)
            setEditingPlan(null)
          }}
          onSave={(newPlan) => {
            if (isCreating) {
              setPlans([...plans, newPlan])
            } else {
              setPlans(plans.map(p => p.id === newPlan.id ? newPlan : p))
            }
            setIsCreating(false)
            setEditingPlan(null)
          }}
        />
      )}

      <div className="table-wrapper">
        <table className="data-table comfortable">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Accounts</th>
              <th>Features</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  <span style={{ fontWeight: 600, color: "var(--color-gray-100)" }}>
                    {plan.name}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: "monospace", fontSize: "1rem" }}>
                    ${Number(plan.price).toFixed(2)}
                  </span>
                </td>
                <td>
                  {plan.isActive ? (
                    <span className="badge badge-profit"><Check size={12} /> Active</span>
                  ) : (
                    <span className="badge badge-neutral"><X size={12} /> Inactive</span>
                  )}
                </td>
                <td>
                  <span style={{ color: "var(--color-gray-400)" }}>
                    {plan.maxAccounts} max
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                    {plan.backtestAccess && <span className="badge badge-brand">Backtest</span>}
                    {featureFlag(plan.features, "replayAccess") && <span className="badge badge-brand">Replay</span>}
                    {featureFlag(plan.features, "propFirmAccess") && <span className="badge badge-brand">PropFirm</span>}
                    {featureFlag(plan.features, "advancedStats") && <span className="badge badge-brand">Stats</span>}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => setEditingPlan(plan)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(plan.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--color-gray-500)" }}>
                  No plans created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
