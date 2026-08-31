"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type Note = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

export function NotesSection({ challengeId }: { challengeId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/notes`)
      if (!res.ok) return
      setNotes(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [challengeId])

  useEffect(() => {
    load()
  }, [load])

  const add = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) throw new Error("Failed")
      setContent("")
      await load()
      toast.success("Note added")
    } catch {
      toast.error("Failed to add note")
    } finally {
      setSaving(false)
    }
  }

  const update = async (id: string) => {
    if (!editContent.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (!res.ok) throw new Error("Failed")
      setEditingId(null)
      await load()
      toast.success("Note updated")
    } catch {
      toast.error("Failed to update note")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this note?")) return
    try {
      await fetch(`/api/challenges/${challengeId}/notes/${id}`, { method: "DELETE" })
      await load()
    } catch {
      toast.error("Failed to delete note")
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)", display: "flex", flexDirection: "column" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem", flexShrink: 0 }}>Journal Notes</h3>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          className="input"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add a note about this challenge… (strategy, plan, lessons)"
          style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", color: "var(--color-gray-100)" }}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add() }}
        />
        <button className="btn btn-primary" onClick={add} disabled={saving || !content.trim()} style={{ padding: "0.5rem 1rem", whiteSpace: "nowrap" }}>
          Add
        </button>
      </div>

      {loading && <div style={{ color: "var(--color-gray-500)", fontSize: "0.8rem", padding: "1rem", textAlign: "center" }}>Loading notes…</div>}

      {!loading && notes.length === 0 && (
        <div style={{ color: "var(--color-gray-500)", fontSize: "0.8rem", padding: "1rem", textAlign: "center" }}>
          No notes yet. Capture your thoughts about each phase.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {notes.map(n => (
          <div key={n.id} style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "1rem" }}>
            {editingId === n.id ? (
              <>
                <textarea
                  className="input"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={3}
                  style={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)" }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
                  <button className="btn btn-outline" onClick={() => setEditingId(null)} style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => update(n.id)} disabled={saving} style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>Save</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "0.88rem", color: "var(--color-gray-200)", whiteSpace: "pre-wrap" }}>{n.content}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{formatDate(n.createdAt)}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => { setEditingId(n.id); setEditContent(n.content) }}
                      style={{ fontSize: "0.72rem", color: "var(--color-brand-500)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(n.id)}
                      style={{ fontSize: "0.72rem", color: "var(--color-loss)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
