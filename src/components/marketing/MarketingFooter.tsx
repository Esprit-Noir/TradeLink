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
    <footer className="bg-[#0a0a0a] border-t border-white/5 pt-20 pb-10">
      <motion.div 
        className="max-w-[1200px] mx-auto px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-20">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Stay Updated</h3>
              <p className="text-gray-400">
                Get trading tips, product updates, and market insights delivered weekly.
              </p>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[400px]">
              {subscribed ? (
                <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg justify-center md:justify-start">
                  <Send size={18} />
                  <span className="font-medium">You&apos;re subscribed! Check your inbox.</span>
                </div>
              ) : (
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-black/50 border border-gray-700 focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none transition-all"
                  />
                  <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 font-semibold rounded-lg transition-colors whitespace-nowrap">
                    <Send size={16} />
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 md:col-span-2 flex flex-col">
            <Link href="/" className="mb-6 inline-block">
              <Image src="/logo-dark.png" alt="TradeLink" width={200} height={48} className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              The modern trading journal for serious traders. Build discipline, track progress, and scale your edge with AI.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Product</h4>
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Reviews</a>
            <a href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Log in</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Resources</h4>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">API</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Changelog</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-semibold mb-2">Company</h4>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">About</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-800/50">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} TradeLink. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-white transition-colors font-medium">𝕏</a>
            <a href="#" aria-label="Discord" className="text-gray-500 hover:text-white transition-colors font-medium">Discord</a>
            <a href="#" aria-label="YouTube" className="text-gray-500 hover:text-white transition-colors font-medium">YouTube</a>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
