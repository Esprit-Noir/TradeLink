"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsVisible(false)
      const timer = setTimeout(() => {
        setIsVisible(true)
        prevPathname.current = pathname
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : "translateY(6px)",
        transition: "opacity 200ms ease, transform 200ms ease",
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  )
}
