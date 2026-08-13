// lib/dates.ts
// Helpers timezone-aware pour le regroupement par jour / heure.
// N'utilise que Intl.DateTimeFormat — aucune dépendance externe.

/**
 * Clé "YYYY-MM-DD" du jour contenant `date`, exprimé dans `timezone`.
 */
export function dayKey(date: Date, timezone = "UTC"): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

/**
 * Heure (0-23) de `date` dans `timezone`.
 */
export function hourOfDay(date: Date, timezone = "UTC"): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date)
  return Number(hour)
}

/**
 * Jour de la semaine (0 = dimanche, 6 = samedi) dans `timezone`,
 * cohérent avec Date.prototype.getDay().
 */
export function dayOfWeek(date: Date, timezone = "UTC"): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date)
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[short] ?? date.getDay()
}

// Offset de `timezone` en millisecondes à l'instant `date`.
function tzOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  return asUtc - date.getTime()
}

/**
 * Convertit une date "mur" (dont les composantes locales Y/M/D/H/M/S sont
 * interprétées comme de l'heure locale de `timezone`) en instant UTC réel.
 * Gère les changements d'offset (DST) en deux passes.
 */
export function zonedTimeToUtc(wall: Date, timezone: string): Date {
  const asUtc = Date.UTC(
    wall.getFullYear(),
    wall.getMonth(),
    wall.getDate(),
    wall.getHours(),
    wall.getMinutes(),
    wall.getSeconds(),
    wall.getMilliseconds(),
  )
  let guess = new Date(asUtc - tzOffsetMs(new Date(asUtc), timezone))
  const refined = new Date(asUtc - tzOffsetMs(guess, timezone))
  if (refined.getTime() !== guess.getTime()) guess = refined
  return guess
}

/**
 * Instant UTC correspondant au début (minuit) du jour contenant `date`
 * dans `timezone`.
 */
export function startOfDayInTz(date: Date, timezone: string): Date {
  const [y, m, d] = dayKey(date, timezone).split("-").map(Number)
  return zonedTimeToUtc(new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)), timezone)
}

/**
 * Instant UTC du prochain minuit (fin de journée) après `date`
 * dans `timezone`. Utilisé pour le reset quotidien des challenges prop firm.
 */
export function nextMidnightInTz(after: Date, timezone: string): Date {
  const [y, m, d] = dayKey(after, timezone).split("-").map(Number)
  return zonedTimeToUtc(new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0)), timezone)
}
