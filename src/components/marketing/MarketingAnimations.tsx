"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp } from "lucide-react"

export function MarketingAnimations() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setScrollProgress(progress)
      setShowBackToTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href")
        if (href && href.length > 1) {
          e.preventDefault()
          const target = document.querySelector(href)
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }
      })
    })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] bg-transparent" style={{ pointerEvents: "none" }}>
        <motion.div
          className="h-full origin-left"
          style={{ width: `${scrollProgress}%`, background: "var(--color-brand-500)" }}
          transition={{ ease: "linear" }}
        />
      </div>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-5 right-5 z-[150] w-9 h-9 rounded-lg bg-[#0a0a0a] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/[0.15] transition-colors duration-150"
          >
            <ArrowUp size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
