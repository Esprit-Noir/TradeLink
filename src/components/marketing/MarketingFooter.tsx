"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Send } from "lucide-react"
import { motion } from "framer-motion"

export function MarketingFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail("")
    }
  }

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-24 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--color-brand-500)]/5 blur-[150px] pointer-events-none rounded-[100%]" />
      
      <motion.div 
        className="max-w-[1200px] mx-auto px-6 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-24">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="text-center md:text-left flex-1 relative z-10">
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Level Up Your Edge</h3>
              <p className="text-gray-400 font-medium text-lg max-w-md">
                Get trading tips, quant strategies, and product updates delivered weekly.
              </p>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[420px] relative z-10">
              {subscribed ? (
                <div className="flex items-center gap-3 px-6 py-4 bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 text-[var(--color-brand-500)] rounded-xl justify-center md:justify-start shadow-inner">
                  <Send size={18} />
                  <span className="font-semibold">You&apos;re subscribed! Check your inbox.</span>
                </div>
              ) : (
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-black border border-white/10 focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] rounded-xl px-5 py-4 text-white placeholder-gray-500 outline-none transition-all font-medium"
                  />
                  <button type="submit" className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 whitespace-nowrap">
                    <Send size={18} />
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 md:col-span-2 flex flex-col">
            <Link href="/" className="mb-8 inline-block">
              <Image src="/logo-dark.png" alt="TradeLink" width={200} height={48} className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm font-medium">
              The professional trading journal designed for funded traders and serious quants. Build discipline, track your true edge, and never blow an account again.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-3 tracking-wide text-sm uppercase">Product</h4>
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Reviews</a>
            <a href="/login" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Log in</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-3 tracking-wide text-sm uppercase">Resources</h4>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Documentation</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">API</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Blog</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Changelog</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-3 tracking-wide text-sm uppercase">Company</h4>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">About</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Careers</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Terms of Service</a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
          <p className="text-sm text-gray-600 font-medium">&copy; {new Date().getFullYear()} TradeLink. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-[var(--color-brand-500)] transition-colors font-semibold text-lg">𝕏</a>
            <a href="#" aria-label="Discord" className="text-gray-500 hover:text-[#5865F2] transition-colors font-semibold text-sm uppercase tracking-wider">Discord</a>
            <a href="#" aria-label="YouTube" className="text-gray-500 hover:text-[#FF0000] transition-colors font-semibold text-sm uppercase tracking-wider">YouTube</a>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
