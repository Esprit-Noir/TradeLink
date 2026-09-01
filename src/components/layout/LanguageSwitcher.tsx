"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [currentLocale, setCurrentLocale] = useState("en")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const match = document.cookie.match(/(^| )NEXT_LOCALE=([^;]+)/)
    if (match) setCurrentLocale(match[2])
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [pendingLocale, setPendingLocale] = useState<string | null>(null)

  useEffect(() => {
    if (pendingLocale) {
      document.cookie = `NEXT_LOCALE=${pendingLocale}; path=/; max-age=31536000`
      router.refresh()
    }
  }, [pendingLocale, router])

  const setLanguage = (loc: string) => {
    setCurrentLocale(loc)
    setPendingLocale(loc)
    setOpen(false)
  }

  const activeLang = LANGUAGES.find(l => l.code === currentLocale) || LANGUAGES[0]

  return (
    <div className="lang-wrapper" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="lang-btn"
      >
        <span style={{ fontSize: "14px" }}>{activeLang.flag}</span>
        <span className="uppercase">{activeLang.code}</span>
        <ChevronDown
          size={14}
          style={{
            color: "var(--color-gray-400)",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`lang-option ${currentLocale === lang.code ? "active" : ""}`}
            >
              <span style={{ fontSize: "15px" }}>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
