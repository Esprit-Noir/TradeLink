"use client"

import { useEffect, useState } from "react"
import { Command } from "cmdk"
import { Search, Plus, BookOpen, LineChart, Calendar, Settings, X, FolderKanban } from "lucide-react"
import { useRouter } from "next/navigation"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="cmd-k-trigger"
        aria-label="Open command palette"
      >
        <Search size={14} className="cmd-k-icon" />
        <span className="cmd-k-text">Search...</span>
        <kbd className="cmd-k-kbd">⌘K</kbd>
      </button>

      {open && (
        <div className="cmd-k-overlay" onClick={() => setOpen(false)}>
          <div className="cmd-k-dialog" onClick={(e) => e.stopPropagation()}>
            <Command>
              <div className="cmd-k-header">
                <Search size={16} className="cmd-k-search-icon" />
                <Command.Input placeholder="Type a command or search..." autoFocus />
                <button className="cmd-k-close" onClick={() => setOpen(false)}>
                  <X size={14} />
                </button>
              </div>

              <Command.List>
                <Command.Empty>No results found.</Command.Empty>

                <Command.Group heading="Quick Actions">
                  <Command.Item onSelect={() => runCommand(() => router.push("/trades"))}>
                    <Plus size={14} />
                    <span>Log New Trade</span>
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => router.push("/import"))}>
                    <FolderKanban size={14} />
                    <span>Import Trades</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Navigation">
                  <Command.Item onSelect={() => runCommand(() => router.push("/dashboard"))}>
                    <LineChart size={14} />
                    <span>Dashboard</span>
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => router.push("/journal/" + new Date().toISOString().split("T")[0]))}>
                    <BookOpen size={14} />
                    <span>Journal</span>
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => router.push("/stats"))}>
                    <LineChart size={14} />
                    <span>Analytics</span>
                  </Command.Item>
                  <Command.Item onSelect={() => runCommand(() => router.push("/calendar"))}>
                    <Calendar size={14} />
                    <span>Calendar</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings">
                  <Command.Item onSelect={() => runCommand(() => router.push("/profile"))}>
                    <Settings size={14} />
                    <span>Preferences</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  )
}
