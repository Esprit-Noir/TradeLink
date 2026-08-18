/**
 * Formats a numeric value into a currency string based on the given baseCurrency.
 */
export function formatCurrency(amount: number, currency: string = "USD", includeSign: boolean = false, fractionDigits: number = 2): string {
  const abs = Math.abs(amount)
  const sign = includeSign && amount > 0 ? "+" : amount < 0 ? "-" : ""
  
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(abs)
  
  return `${sign}${formatted}`
}

/**
 * Formats a price number with appropriate decimal places.
 * Strips trailing zeros, respects natural wicks (e.g. XAU/USD).
 */
export function fmtPrice(v: number): string {
  if (v == null || isNaN(v)) return "—"
  const a = Math.abs(v)
  if (a >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (a >= 1) return v.toFixed(2)
  if (a >= 0.01) return v.toFixed(4)
  return v.toFixed(6)
}

/**
 * Formats a Date object into a readable string based on the user's timezone.
 */
export function formatDateWithTimezone(date: Date | string | number, timezone: string = "UTC", includeTime: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
  }

  try {
    return new Intl.DateTimeFormat("en-US", options).format(new Date(date))
  } catch (e) {
    // Fallback if timezone is invalid
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(date))
  }
}
