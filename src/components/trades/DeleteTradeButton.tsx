"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DeleteTradeButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this trade?")) return
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      // Refresh the current route to fetch updated data from the server
      router.refresh()
    } catch (error) {
      toast.error("Error deleting trade.")
    }
  }

  return (
    <button 
      onClick={handleDelete}
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--color-loss)", padding: "0.4rem 0.65rem" }}
      title="Delete Trade"
    >
      ✕
    </button>
  )
}
