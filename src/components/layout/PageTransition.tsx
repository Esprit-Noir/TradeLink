"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [state, setState] = useState<"entering" | "visible" | "exiting">("visible")
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setState("exiting")
      const exitTimer = setTimeout(() => {
        setState("entering")
        prevPathname.current = pathname
        const enterTimer = setTimeout(() => setState("visible"), 50)
        return () => clearTimeout(enterTimer)
      }, 150)
      return () => clearTimeout(exitTimer)
    }
  }, [pathname])

  return (
    <div
      style={{
        opacity: state === "visible" ? 1 : 0,
        transform: state === "exiting" ? "translateY(-4px)" : state === "entering" ? "translateY(4px)" : "none",
        transition: "opacity 180ms ease-out, transform 180ms ease-out",
        willChange: state === "visible" ? "auto" : "opacity, transform",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem 2rem" }}>
        {children}
      </div>
    </div>
  )
}
