"use client"

import { useEffect } from "react"

export function MarketingAnimations() {
  useEffect(() => {
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
    const handleScroll = () => {
      if (nav) {
        if (window.scrollY > 50) {
          nav.classList.add("scrolled")
        } else {
          nav.classList.remove("scrolled")
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })

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
    }
  }, [])

  return null
}
