"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp } from "lucide-react"

export function MarketingAnimations() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    // Scroll progress + back to top visibility
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setScrollProgress(progress)
      setShowBackToTop(window.scrollY > 600)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    // IntersectionObserver for scroll-triggered animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el)
    })

    // Nav scroll effect
    const nav = document.querySelector(".marketing-nav") as HTMLElement | null
    const handleNavScroll = () => {
      if (nav) {
        if (window.scrollY > 50) {
          nav.classList.add("scrolled")
        } else {
          nav.classList.remove("scrolled")
        }
      }
    }
    window.addEventListener("scroll", handleNavScroll, { passive: true })

    // Smooth scroll for anchor links
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
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("scroll", handleNavScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[200] h-[2px] bg-transparent"
        style={{ pointerEvents: "none" }}
      >
        <motion.div
          className="h-full origin-left"
          style={{
            width: `${scrollProgress}%`,
            background: "linear-gradient(90deg, var(--color-brand-500), #34d399)",
            boxShadow: "0 0 10px rgba(0, 199, 88, 0.8)",
          }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={scrollToTop}
            aria-label="Retour en haut"
            className="fixed bottom-8 right-8 z-[150] w-12 h-12 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:border-[var(--color-brand-500)]/50 hover:shadow-[0_0_20px_rgba(0,199,88,0.2)] transition-all duration-300 hover:-translate-y-1 group"
          >
            <ArrowUp size={18} className="group-hover:text-[var(--color-brand-500)] transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
