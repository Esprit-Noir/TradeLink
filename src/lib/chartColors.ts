/**
 * Shared categorical palette for charts & gauges.
 * Based on design-system tokens (theme-aware via CSS variables) with
 * hex fallbacks for contexts that do not support CSS vars (e.g. SVG stops).
 */
export const CATEGORY_COLORS: string[] = [
  "var(--color-brand-500)",
  "var(--color-profit)",
  "var(--color-warning)",
  "var(--color-info)",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f59e0b",
]
