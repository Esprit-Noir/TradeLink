"use client"

import Link from "next/link"
import Image from "next/image"

export function MarketingFooter() {
  return (
    <footer className="bg-transparent border-t border-white/[0.04] pt-12 pb-6">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <Link href="/" className="mb-4 inline-block"><Image src="/logo-dark.png" alt="TradeLink" width={140} height={36} className="h-7 w-auto" /></Link>
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-[220px]">Professional trading journal for funded traders. Build discipline, track your edge.</p>
          </div>
          <div>
            <h4 className="text-white text-[11px] font-semibold mb-3">Products</h4>
            <ul className="space-y-2">{["Journaling", "Backtesting", "Trade Replay", "AI Insights", "Prop Firm Sync"].map(l => <li key={l}><a href="#" className="text-[11px] text-gray-500 hover:text-white transition-colors">{l}</a></li>)}</ul>
          </div>
          <div>
            <h4 className="text-white text-[11px] font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">{["Blog", "Strategies", "Changelog", "Knowledge Base", "Community"].map(l => <li key={l}><a href="#" className="text-[11px] text-gray-500 hover:text-white transition-colors">{l}</a></li>)}</ul>
          </div>
          <div>
            <h4 className="text-white text-[11px] font-semibold mb-3">Company</h4>
            <ul className="space-y-2">{["About", "Careers", "Privacy Policy", "Terms", "Contact Us"].map(l => <li key={l}><a href="#" className="text-[11px] text-gray-500 hover:text-white transition-colors">{l}</a></li>)}</ul>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-5 mb-5">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Compare</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {["vs TradeZella", "vs TraderSync", "vs Edgewonk", "vs Notion", "vs Excel"].map(l => <a key={l} href="#" className="text-[11px] text-gray-500 hover:text-white transition-colors">{l}</a>)}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-5 border-t border-white/[0.04]">
          <p className="text-[10px] text-gray-600">© {new Date().getFullYear()} TradeLink. All rights reserved.</p>
          <p className="text-[10px] text-gray-600">Trading involves substantial risk. Not appropriate for everyone.</p>
        </div>
      </div>
    </footer>
  )
}
