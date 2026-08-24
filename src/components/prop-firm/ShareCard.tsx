"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type CardData = {
  challengeId: string
  firmName: string
  programName: string
  logoUrl: string | null
  accountName: string
  phase: string
  status: string
  initialBalance: number
  currentBalance: number
  currentProfitPct: number
  profitTargetPct: number
  targetProgressPct: number
  maxDDPct: number
  ddUsedPct: number
  tradingDays: number
  minTradingDays: number | null
  daysRemaining: number | null
}

export function ShareCard({ data }: { data: CardData }) {
  const [open, setOpen] = useState(false)
  const [loadingLink, setLoadingLink] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Load logo as a data URL so the SVG stays self-contained for export
  useEffect(() => {
    if (!data.logoUrl) { setLogoDataUrl(null); return }
    let cancelled = false
    fetch(data.logoUrl)
      .then(r => r.blob())
      .then(b => new Promise<string>((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res(String(fr.result))
        fr.onerror = rej
        fr.readAsDataURL(b)
      }))
      .then(url => { if (!cancelled) setLogoDataUrl(url) })
      .catch(() => { if (!cancelled) setLogoDataUrl(null) })
    return () => { cancelled = true }
  }, [data.logoUrl])

  const buildSvg = useCallback((logo: string | null, scale = 1) => {
    const W = 640, H = 400
    const w = W * scale, h = H * scale
    const statusColor = data.status === "passed" ? "#00c758" : data.status === "breached" || data.status === "failed" ? "#ef4444" : "#8b5cf6"
    const profit = data.currentBalance - data.initialBalance
    const profitColor = profit >= 0 ? "#00c758" : "#ef4444"
    const targetPct = Math.min(100, Math.max(0, data.targetProgressPct))
    const ddPct = Math.min(100, Math.max(0, data.ddUsedPct))
    const ddColor = ddPct >= 80 ? "#ef4444" : ddPct >= 60 ? "#f59e0b" : "#00c758"

    const bar = (x: number, y: number, width: number, pct: number, color: string, label: string, valueLabel: string) => `
      <text x="${x}" y="${y}" font-size="${11 * scale}" fill="#9ca3af" font-family="system-ui, sans-serif">${label}</text>
      <text x="${x + width}" y="${y}" font-size="${11 * scale}" fill="#e5e7eb" font-family="system-ui, sans-serif" text-anchor="end" font-weight="600">${valueLabel}</text>
      <rect x="${x}" y="${y + 6 * scale}" width="${width}" height="${6 * scale}" rx="${3 * scale}" fill="#1f2937"/>
      <rect x="${x}" y="${y + 6 * scale}" width="${Math.min(width, width * pct / 100)}" height="${6 * scale}" rx="${3 * scale}" fill="${color}"/>
    `

    const logoTag = logo
      ? `<image href="${logo}" x="${24 * scale}" y="${24 * scale}" width="${40 * scale}" height="${40 * scale}" preserveAspectRatio="xMidYMid meet"/>`
      : ""

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="20" fill="url(#bg)"/>
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="${statusColor}"/>

  ${logoTag}
  <text x="${logo ? 80 : 24}${scale}" y="${36 * scale}" font-size="${20 * scale}" font-weight="700" fill="#f9fafb" font-family="system-ui, sans-serif">${escapeXml(data.firmName)}</text>
  <text x="${logo ? 80 : 24}${scale}" y="${56 * scale}" font-size="${12 * scale}" fill="#9ca3af" font-family="system-ui, sans-serif">${escapeXml(data.programName)} · ${escapeXml(data.accountName)}</text>

  <rect x="${W - 150 * scale}" y="${22 * scale}" width="${126 * scale}" height="${30 * scale}" rx="${8 * scale}" fill="${statusColor}" opacity="0.15"/>
  <text x="${W - 87 * scale}" y="${42 * scale}" font-size="${13 * scale}" font-weight="700" fill="${statusColor}" text-anchor="middle" font-family="system-ui, sans-serif">${escapeXml(data.status.toUpperCase())}</text>

  <text x="${24 * scale}" y="${110 * scale}" font-size="${13 * scale}" fill="#9ca3af" font-family="system-ui, sans-serif">PROGRESS</text>
  <text x="${W - 24 * scale}" y="${110 * scale}" font-size="${26 * scale}" font-weight="700" fill="${profitColor}" text-anchor="end" font-family="system-ui, sans-serif">${data.currentProfitPct >= 0 ? "+" : ""}${data.currentProfitPct.toFixed(1)}%</text>

  ${bar(24, 140, W - 48, targetPct, "#8b5cf6", `Profit Target (${data.profitTargetPct}%)`, `${targetPct.toFixed(0)}%`)}
  ${bar(24, 185, W - 48, ddPct, ddColor, `Max Drawdown (${data.maxDDPct}%)`, `${ddPct.toFixed(1)}% used`)}

  <text x="${24 * scale}" y="${255 * scale}" font-size="${11 * scale}" fill="#9ca3af" font-family="system-ui, sans-serif">BALANCE</text>
  <text x="${24 * scale}" y="${280 * scale}" font-size="${24 * scale}" font-weight="700" fill="#f9fafb" font-family="system-ui, sans-serif">$${data.currentBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}</text>

  <text x="${W / 2 * scale}" y="${255 * scale}" font-size="${11 * scale}" fill="#9ca3af" text-anchor="middle" font-family="system-ui, sans-serif">PHASE</text>
  <text x="${W / 2 * scale}" y="${280 * scale}" font-size="${24 * scale}" font-weight="700" fill="#f9fafb" text-anchor="middle" font-family="system-ui, sans-serif">${escapeXml(data.phase.replace('_', ' ').toUpperCase())}</text>

  <text x="${W - 24 * scale}" y="${255 * scale}" font-size="${11 * scale}" fill="#9ca3af" text-anchor="end" font-family="system-ui, sans-serif">TRADING DAYS</text>
  <text x="${W - 24 * scale}" y="${280 * scale}" font-size="${24 * scale}" font-weight="700" fill="#f9fafb" text-anchor="end" font-family="system-ui, sans-serif">${data.tradingDays}${data.minTradingDays ? `/${data.minTradingDays}` : ""}</text>

  <text x="${24 * scale}" y="${330 * scale}" font-size="${11 * scale}" fill="#6b7280" font-family="system-ui, sans-serif">
    Generated with TradeLink${data.daysRemaining !== null ? ` · ${data.daysRemaining} day(s) left on deadline` : ""}
  </text>
</svg>`
  }, [data])

  const generate = useCallback(async () => {
    const svg = buildSvg(logoDataUrl)
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    setPreview(url)
  }, [buildSvg, logoDataUrl])

  useEffect(() => {
    if (open) generate()
  }, [open, generate])

  const downloadPng = async () => {
    const scale = 2
    const svg = buildSvg(logoDataUrl, scale)
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("load failed"))
        img.src = url
      })
      const canvas = document.createElement("canvas")
      canvas.width = 640 * scale
      canvas.height = 400 * scale
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      const pngUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = pngUrl
      a.download = `${data.firmName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-challenge.png`
      a.click()
      toast.success("Progress card downloaded")
    } catch {
      toast.error("Could not generate PNG")
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const downloadSvg = () => {
    const svg = buildSvg(logoDataUrl)
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.firmName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-challenge.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Progress card downloaded (SVG)")
  }

  const handleGetLink = async () => {
    if (publicUrl) {
      navigator.clipboard.writeText(window.location.origin + publicUrl)
      toast.success("Link copied to clipboard!")
      return
    }

    setLoadingLink(true)
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "challenge", entityId: data.challengeId })
      })
      if (!res.ok) throw new Error("Failed to generate link")
      const json = await res.json()
      setPublicUrl(json.url)
      navigator.clipboard.writeText(window.location.origin + json.url)
      toast.success("Public link copied to clipboard!")
    } catch {
      toast.error("Failed to generate share link")
    } finally {
      setLoadingLink(false)
    }
  }

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
        Share
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
        }} onClick={() => setOpen(false)}>
          <div
            className="chart-card"
            style={{ padding: "1.5rem", maxWidth: 680, width: "100%" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700 }}>Share progress card</div>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
            </div>

            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Progress card preview" style={{ width: "100%", borderRadius: "12px", marginBottom: "1rem" }} />
            )}

            {publicUrl && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(0,199,88,0.1)", border: "1px solid rgba(0,199,88,0.2)", borderRadius: "8px", color: "var(--color-profit)", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{window.location.origin + publicUrl}</span>
                <button onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + publicUrl)
                  toast.success("Copied!")
                }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}>Copy</button>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
              <button className="btn btn-primary" onClick={handleGetLink} disabled={loadingLink} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                {loadingLink ? "Generating..." : publicUrl ? "Copy Public Link" : "Get Public Link"}
              </button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-outline" onClick={downloadSvg} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                  Download SVG
                </button>
                <button className="btn btn-outline" onClick={downloadPng} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)" }}>
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function escapeXml(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
