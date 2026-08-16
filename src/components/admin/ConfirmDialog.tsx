"use client"

import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmColor = variant === "danger"
    ? "var(--color-loss)"
    : variant === "warning"
    ? "var(--color-warning)"
    : "var(--color-brand-500)"

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div className="card" style={{ position: "relative", width: "100%", maxWidth: 400, padding: "1.5rem", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {variant !== "default" && (
            <div style={{ padding: 6, borderRadius: 8, background: variant === "danger" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)" }}>
              <AlertTriangle size={16} style={{ color: confirmColor }} />
            </div>
          )}
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-200)" }}>{title}</h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              fontSize: "0.8rem",
              background: confirmColor,
              color: "white",
              border: "none",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
