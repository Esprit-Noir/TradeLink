"use client"

import { useEffect, useState, useMemo } from "react"
import { CalendarClock } from "lucide-react"

type EcoEvent = {
  title: string
  country: string
  date: string
  impact: string // "High", "Medium", "Low", "Non-Economic"
  forecast: string
  previous: string
}

export function EconomicCalendarWidget({ limit = 5 }: { limit?: number }) {
  const [events, setEvents] = useState<EcoEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [impactFilter, setImpactFilter] = useState("All")
  const [dateFilter, setDateFilter] = useState("This Week")
  const [currencyFilter, setCurrencyFilter] = useState("All")

  useEffect(() => {
    // Fetch from ForexFactory public JSON (this is a proxy/mirror often used for widgets)
    // Note: In a real prod app, you'd proxy this through your own Next.js API to avoid CORS or rely on a paid API like Finnhub.
    // For this MVP, we will simulate a fetch using a static list if the fetch fails (due to CORS).
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/calendar")
        if (!res.ok) throw new Error("Failed to fetch")
        const data: EcoEvent[] = await res.json()
        
        // Keep all events but sort by date
        const allWeek = data
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          
        setEvents(allWeek)
      } catch (err) {
        console.warn("Failed to fetch live macro calendar, using fallback data", err)
        setError(true)
        // Fallback data for demo purposes
        const now = new Date()
        setEvents([
          { title: "CPI m/m", country: "USD", date: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(), impact: "High", forecast: "0.2%", previous: "0.2%" },
          { title: "Unemployment Claims", country: "USD", date: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(), impact: "Medium", forecast: "215K", previous: "212K" },
          { title: "ECB Press Conference", country: "EUR", date: new Date(now.getTime() + 1000 * 60 * 60 * 26).toISOString(), impact: "High", forecast: "", previous: "" },
          { title: "NFP (Non-Farm Employment)", country: "USD", date: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString(), impact: "High", forecast: "180K", previous: "175K" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    let filtered = events

    if (impactFilter !== "All") {
      filtered = filtered.filter(e => e.impact === impactFilter)
    }

    if (currencyFilter !== "All") {
      filtered = filtered.filter(e => e.country === currencyFilter)
    }

    if (dateFilter !== "This Week") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)

      filtered = filtered.filter(e => {
        const eDate = new Date(e.date)
        if (dateFilter === "All Upcoming") {
          return eDate >= now
        }
        if (dateFilter === "Yesterday") {
          return eDate >= yesterday && eDate < today
        }
        if (dateFilter === "Today") {
          return eDate >= today && eDate < tomorrow
        }
        if (dateFilter === "Tomorrow") {
          return eDate >= tomorrow && eDate < dayAfterTomorrow
        }
        return true
      })
    }

    return filtered
  }, [events, impactFilter, dateFilter, currencyFilter, limit])

  if (loading) {
    return <div className="skeleton h-[250px] w-full rounded-[var(--radius-card)]" />
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "var(--color-loss)"
      case "Medium": return "var(--color-warning)"
      case "Low": return "var(--color-gray-400)"
      default: return "var(--color-gray-500)"
    }
  }

  const getFlag = (currency: string) => {
    switch (currency) {
      case "USD": return "🇺🇸"
      case "EUR": return "🇪🇺"
      case "GBP": return "🇬🇧"
      case "JPY": return "🇯🇵"
      case "AUD": return "🇦🇺"
      case "CAD": return "🇨🇦"
      case "CHF": return "🇨🇭"
      case "NZD": return "🇳🇿"
      case "CNY": return "🇨🇳"
      default: return ""
    }
  }

  return (
    <div className="chart-card flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-[var(--color-brand-400)]" />
          <h3 className="font-bold text-[var(--color-gray-100)] text-sm uppercase tracking-wider">Macro Calendar</h3>
          {error && <span className="text-[10px] bg-[var(--color-gray-800)] px-2 py-0.5 rounded text-[var(--color-gray-400)] ml-2">Demo Data</span>}
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="input select h-8 text-xs py-0 pl-2 pr-6 min-w-[100px]" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="All Upcoming">All Upcoming</option>
            <option value="This Week">This Week (All)</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Today">Today</option>
            <option value="Tomorrow">Tomorrow</option>
          </select>
          <select 
            className="input select h-8 text-xs py-0 pl-2 pr-6 min-w-[110px]"
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
          >
            <option value="All">All Impacts</option>
            <option value="High">High Impact</option>
            <option value="Medium">Medium Impact</option>
            <option value="Low">Low Impact</option>
            <option value="Non-Economic">Non-Economic</option>
          </select>
          <select 
            className="input select h-8 text-xs py-0 pl-2 pr-6 min-w-[80px]"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
          >
            <option value="All">All Currencies</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="JPY">🇯🇵 JPY</option>
            <option value="AUD">🇦🇺 AUD</option>
            <option value="CAD">🇨🇦 CAD</option>
            <option value="CHF">🇨🇭 CHF</option>
            <option value="NZD">🇳🇿 NZD</option>
            <option value="CNY">🇨🇳 CNY</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex items-center justify-center text-sm text-[var(--color-gray-500)] py-4 h-[200px]">No upcoming events this week.</div>
      ) : (
        <div className="overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar" style={{ maxHeight: '560px' }}>
          {filteredEvents.map((e, i) => {
            const date = new Date(e.date)
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const dayStr = date.toLocaleDateString([], { weekday: 'short' })
            
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-gray-800)] hover:bg-[var(--color-gray-700)] transition-colors">
                <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-[var(--color-gray-700)] pr-3">
                  <span className="text-xs text-[var(--color-gray-400)] font-bold">{dayStr}</span>
                  <span className="text-xs text-[var(--color-gray-200)] tabular-nums">{timeStr}</span>
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1" 
                      style={{ backgroundColor: `${getImpactColor(e.impact)}20`, color: getImpactColor(e.impact) }}
                    >
                      {getFlag(e.country)} {e.country}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-gray-100)] truncate flex-1" title={e.title}>
                      {e.title}
                    </span>
                    <span 
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: `${getImpactColor(e.impact)}20`, color: getImpactColor(e.impact) }}
                    >
                      {e.impact}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {e.forecast && (
                      <span className="text-[10px] text-[var(--color-gray-500)]">
                        Forecast: <span className="text-[var(--color-gray-300)]">{e.forecast}</span>
                      </span>
                    )}
                    {e.previous && (
                      <span className="text-[10px] text-[var(--color-gray-500)]">
                        Prev: <span className="text-[var(--color-gray-300)]">{e.previous}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
