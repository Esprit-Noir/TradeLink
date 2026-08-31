import { NextResponse } from "next/server"
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"

const CACHE_FILE = path.join(os.tmpdir(), "forexfactory_calendar_cache.json")
const CACHE_TTL = 3600000 * 2 // 2 hours

const FALLBACK_EVENTS = [
  { title: "CPI m/m", country: "USD", date: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), impact: "High", forecast: "0.2%", previous: "0.2%" },
  { title: "Unemployment Claims", country: "USD", date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), impact: "Medium", forecast: "215K", previous: "212K" },
  { title: "ECB Press Conference", country: "EUR", date: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(), impact: "High", forecast: "", previous: "" },
  { title: "NFP (Non-Farm Employment)", country: "USD", date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), impact: "High", forecast: "180K", previous: "175K" },
]

export async function GET() {
  try {
    // 1. Try to serve from valid cache
    if (fs.existsSync(CACHE_FILE)) {
      const stats = fs.statSync(CACHE_FILE)
      if (Date.now() - stats.mtimeMs < CACHE_TTL) {
        const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
        return NextResponse.json(cachedData, {
          headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
        })
      }
    }
  } catch (e) {
    console.error("Cache read error:", e)
  }

  try {
    // 2. Try to fetch fresh data
    const curlCommand = `curl -s "https://nfs.faireconomy.media/ff_calendar_thisweek.json"`
    const stdout = execSync(curlCommand, { encoding: 'utf-8' })
    
    let data;
    try {
      data = JSON.parse(stdout)
      // Save valid data to cache
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf-8')
      
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      })
    } catch {
      console.warn("Calendar API rate limited. Serving stale cache or fallback.")
      // 3. Fallback to stale cache if API is rate limited
      if (fs.existsSync(CACHE_FILE)) {
        const staleData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
        return NextResponse.json(staleData)
      }
      
      // 4. Ultimate fallback to static data (no cache exists)
      return NextResponse.json(FALLBACK_EVENTS)
    }
  } catch {
    // 5. Catch any execution errors (curl failure)
    if (fs.existsSync(CACHE_FILE)) {
      const staleData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      return NextResponse.json(staleData)
    }
    return NextResponse.json(FALLBACK_EVENTS)
  }
}
