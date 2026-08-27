"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Send, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

// SVG Social Icons
function TwitterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function YouTubeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

export function MarketingFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

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
        {/* Newsletter banner */}
        <div className="mb-24">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="text-center md:text-left flex-1 relative z-10">
              <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Level Up Your Edge</h3>
              <p className="text-gray-400 font-medium text-lg max-w-md">
                Tips trading, stratégies quant et mises à jour produit livrées chaque semaine.
              </p>
            </div>
            
            <div className="w-full md:w-auto md:min-w-[420px] relative z-10">
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 px-6 py-4 bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 text-[var(--color-brand-500)] rounded-xl justify-center md:justify-start"
                >
                  <CheckCircle2 size={20} />
                  <span className="font-semibold">Inscrit ! Vérifiez votre boîte mail.</span>
                </motion.div>
              ) : (
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubscribe}>
                  <div className={`flex-1 relative transition-all duration-300 ${inputFocused ? 'shadow-[0_0_20px_rgba(0,199,88,0.15)]' : ''}`}>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      required
                      className="w-full bg-black border border-white/10 focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] rounded-xl px-5 py-4 text-white placeholder-gray-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <button type="submit" className="flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 whitespace-nowrap">
                    <Send size={18} />
                    S&apos;inscrire
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 md:col-span-2 flex flex-col">
            <Link href="/" className="mb-8 inline-block">
              <Image src="/logo-dark.png" alt="TradeLink" width={200} height={48} className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm font-medium mb-6">
              Le journal de trading professionnel conçu pour les traders financés et les quants sérieux. Bâtissez la discipline, trackez votre vrai edge.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="Twitter / X"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-y-0.5"
              >
                <TwitterIcon size={16} />
              </a>
              <a
                href="#"
                aria-label="Discord"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#5865F2] hover:bg-[#5865F2]/10 hover:border-[#5865F2]/30 transition-all hover:-translate-y-0.5"
              >
                <DiscordIcon size={16} />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/30 transition-all hover:-translate-y-0.5"
              >
                <YouTubeIcon size={16} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-3 tracking-wide text-sm uppercase">Produit</h4>
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Tarifs</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Avis</a>
            <a href="/login" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Connexion</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-3 tracking-wide text-sm uppercase">Ressources</h4>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Documentation</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">API</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Blog</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Changelog</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-3 tracking-wide text-sm uppercase">Entreprise</h4>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">À propos</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Carrières</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">Politique de confidentialité</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[var(--color-brand-500)] transition-colors">CGU</a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
          <p className="text-sm text-gray-600 font-medium">&copy; {new Date().getFullYear()} TradeLink. Tous droits réservés.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
              Tous les systèmes opérationnels
            </span>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
