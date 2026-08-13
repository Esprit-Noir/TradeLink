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
