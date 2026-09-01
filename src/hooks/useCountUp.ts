"use client"

import { useEffect, useRef, useState } from "react"

export function useCountUp(end: number, duration = 800, decimals = 0) {
  const [value, setValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (end === 0) { setValue(0); return }

    startTime.current = null
    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Number((eased * end).toFixed(decimals)))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }

    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [end, duration, decimals])

  return value
}
