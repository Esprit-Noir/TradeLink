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
  
  useEffect(() => {
    const match = document.cookie.match(/(^| )NEXT_LOCALE=([^;]+)/)
    if (match) setCurrentLocale(match[2])
  }, [])

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const setLanguage = (loc: string) => {
    document.cookie = `NEXT_LOCALE=${loc}; path=/; max-age=31536000`
    setCurrentLocale(loc)
    setOpen(false)
    router.refresh()
  }

  const activeLang = LANGUAGES.find(l => l.code === currentLocale) || LANGUAGES[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-gray-100)] bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] px-2.5 py-1.5 rounded-md hover:bg-[var(--color-gray-800)] transition-colors"
      >
        <span style={{ fontSize: "14px" }}>{activeLang.flag}</span>
        <span className="uppercase">{activeLang.code}</span>
        <ChevronDown size={14} className={`text-[var(--color-gray-400)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-36 bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-md shadow-lg overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-[var(--color-gray-800)] transition-colors ${currentLocale === lang.code ? 'bg-[var(--color-gray-800)] text-white' : 'text-[var(--color-gray-400)]'}`}
            >
              <span style={{ fontSize: "16px" }}>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
