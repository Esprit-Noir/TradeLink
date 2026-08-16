interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  style?: React.CSSProperties
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: { background: "var(--color-gray-800)", color: "var(--color-gray-400)", border: "1px solid var(--color-gray-700)" },
  success: { background: "rgba(16,185,129,0.12)", color: "var(--color-profit)", border: "1px solid rgba(16,185,129,0.25)" },
  warning: { background: "rgba(245,158,11,0.12)", color: "var(--color-warning)", border: "1px solid rgba(245,158,11,0.25)" },
  danger: { background: "rgba(239,68,68,0.12)", color: "var(--color-loss)", border: "1px solid rgba(239,68,68,0.25)" },
  info: { background: "rgba(59,130,246,0.12)", color: "var(--color-info)", border: "1px solid rgba(59,130,246,0.25)" },
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "0.2rem 0.5rem",
      borderRadius: 6,
      fontSize: "0.65rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      ...VARIANT_STYLES[variant],
      ...style,
    }}>
      {children}
    </span>
  )
}
