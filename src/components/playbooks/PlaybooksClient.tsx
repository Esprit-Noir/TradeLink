"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Plus, Pencil, Trash2, ChevronRight, X, Save, Tag, Target, ShieldCheck, Zap } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { useTranslations } from "next-intl"

interface Playbook {
  id: string
  name: string
  description: string | null
  tags: string[]
  entryRules: unknown
  exitRules: unknown
  riskRules: unknown
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const EMPTY_FORM = { name: "", description: "", tags: "", entryRules: "", exitRules: "", riskRules: "" }

const TAG_COLORS: Record<string, string> = {
  trend: "var(--color-profit)",
  breakout: "var(--color-info)",
  scalping: "var(--color-warning)",
  swing: "#8B5CF6",
  reversal: "var(--color-loss)",
  default: "var(--color-gray-400)",
}

function getTagColor(tag: string) {
  const key = Object.keys(TAG_COLORS).find(k => tag.toLowerCase().includes(k))
  return key ? TAG_COLORS[key] : TAG_COLORS.default
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
}

export function PlaybooksClient() {
  const t = useTranslations("playbooks")
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchPlaybooks = useCallback(async () => {
    try {
      const res = await fetch("/api/playbooks")
      const data = await res.json()
      setPlaybooks(data.data ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPlaybooks() }, [fetchPlaybooks])

  const openNew = () => {
    setEditingId("new")
    setForm(EMPTY_FORM)
    setExpandedId(null)
  }

  const openEdit = (p: Playbook) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description ?? "",
      tags: p.tags.join(", "),
      entryRules: p.entryRules ? JSON.stringify(p.entryRules, null, 2) : "",
      exitRules: p.exitRules ? JSON.stringify(p.exitRules, null, 2) : "",
      riskRules: p.riskRules ? JSON.stringify(p.riskRules, null, 2) : "",
    })
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
        entryRules: form.entryRules ? JSON.parse(form.entryRules) : null,
        exitRules: form.exitRules ? JSON.parse(form.exitRules) : null,
        riskRules: form.riskRules ? JSON.parse(form.riskRules) : null,
      }

      if (editingId === "new") {
        await fetch("/api/playbooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      } else {
        await fetch(`/api/playbooks/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      setEditingId(null)
      fetchPlaybooks()
    } catch {}
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this playbook?")) return
    await fetch(`/api/playbooks/${id}`, { method: "DELETE" })
    fetchPlaybooks()
  }

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={20} style={{ color: "var(--color-brand-500)" }} />
          <h1 className="page-title" style={{ fontSize: "1.5rem" }}>{t("title")}</h1>
        </div>
        <button className="btn btn-primary" onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> {t("new")}
        </button>
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {editingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{
            position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{
              width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto",
              background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: 16, padding: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
                  {editingId === "new" ? t("new") : t("edit")}
                </h2>
                <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "var(--color-gray-400)", cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>{t("form.name")} *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder={t("form.namePh")} />
                </div>
                <div>
                  <label style={labelStyle}>{t("form.description")}</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, minHeight: 60 }} placeholder={t("form.descriptionPh")} />
                </div>
                <div>
                  <label style={labelStyle}>{t("form.tags")}</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inputStyle} placeholder={t("form.tagsPh")} />
                </div>
                <div>
                  <label style={labelStyle}>{t("form.entryRules")}</label>
                  <textarea value={form.entryRules} onChange={e => setForm(f => ({ ...f, entryRules: e.target.value }))} style={{ ...inputStyle, minHeight: 80, fontFamily: "monospace", fontSize: "0.8rem" }} placeholder={t("form.entryRulesPh")} />
                </div>
                <div>
                  <label style={labelStyle}>{t("form.exitRules")}</label>
                  <textarea value={form.exitRules} onChange={e => setForm(f => ({ ...f, exitRules: e.target.value }))} style={{ ...inputStyle, minHeight: 80, fontFamily: "monospace", fontSize: "0.8rem" }} placeholder={t("form.exitRulesPh")} />
                </div>
                <div>
                  <label style={labelStyle}>{t("form.riskRules")}</label>
                  <textarea value={form.riskRules} onChange={e => setForm(f => ({ ...f, riskRules: e.target.value }))} style={{ ...inputStyle, minHeight: 80, fontFamily: "monospace", fontSize: "0.8rem" }} placeholder={t("form.riskRulesPh")} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>{t("form.cancel")}</button>
                <button onClick={save} disabled={saving || !form.name.trim()} style={saveBtnStyle}>
                  <Save size={14} /> {saving ? "..." : t("form.save")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playbook List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      ) : playbooks.length === 0 ? (
        <motion.div variants={itemVariants} className="chart-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--color-brand-muted)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <BookOpen size={32} style={{ color: "var(--color-brand-500)" }} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: 6 }}>{t("emptyTitle")}</h3>
          <p style={{ color: "var(--color-gray-400)", textAlign: "center", maxWidth: 360, marginBottom: 20, fontSize: "0.85rem", lineHeight: 1.6 }}>{t("emptyDesc")}</p>
          <button className="btn btn-primary" onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> {t("new")}
          </button>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {playbooks.map(p => {
            const isExpanded = expandedId === p.id
            return (
              <motion.div key={p.id} variants={itemVariants} className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.25rem", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-brand-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={18} style={{ color: "var(--color-brand-500)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-100)" }}>{p.name}</h3>
                      {!p.isActive && <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 4, background: "var(--color-gray-800)", color: "var(--color-gray-500)" }}>INACTIVE</span>}
                    </div>
                    {p.description && <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {p.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 99, background: `${getTagColor(tag)}22`, color: getTagColor(tag), fontWeight: 600 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--color-gray-500)", transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div style={{ padding: "0 1.25rem 1rem", borderTop: "1px solid var(--color-gray-800)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
                          <RuleBlock icon={Target} label={t("card.entry")} rules={p.entryRules} color="var(--color-profit)" />
                          <RuleBlock icon={ShieldCheck} label={t("card.exit")} rules={p.exitRules} color="var(--color-info)" />
                          <RuleBlock icon={Zap} label={t("card.risk")} rules={p.riskRules} color="var(--color-warning)" />
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                          <button onClick={() => openEdit(p)} style={actionBtnStyle}>
                            <Pencil size={14} /> {t("card.edit")}
                          </button>
                          <button onClick={() => remove(p.id)} style={{ ...actionBtnStyle, color: "var(--color-loss)" }}>
                            <Trash2 size={14} /> {t("card.delete")}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function RuleBlock({ icon: Icon, label, rules, color }: { icon: React.ElementType; label: string; rules: unknown; color: string }) {
  return (
    <div style={{ padding: "0.75rem", borderRadius: 10, background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      {rules ? (
        <pre style={{ fontSize: "0.72rem", color: "var(--color-gray-300)", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, fontFamily: "monospace", lineHeight: 1.5, maxHeight: 120, overflow: "auto" }}>
          {typeof rules === "string" ? rules : JSON.stringify(rules, null, 2)}
        </pre>
      ) : (
        <p style={{ fontSize: "0.72rem", color: "var(--color-gray-600)", fontStyle: "italic" }}>No rules defined</p>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 600, color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" }
const inputStyle: React.CSSProperties = { width: "100%", padding: "0.6rem 0.75rem", background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: 8, color: "var(--color-gray-100)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }
const cancelBtnStyle: React.CSSProperties = { padding: "0.5rem 1rem", borderRadius: 8, background: "var(--color-gray-800)", color: "var(--color-gray-300)", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }
const saveBtnStyle: React.CSSProperties = { padding: "0.5rem 1rem", borderRadius: 8, background: "var(--color-brand-500)", color: "#000", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }
const actionBtnStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, padding: "0.4rem 0.75rem", borderRadius: 6, background: "var(--color-gray-800)", color: "var(--color-gray-300)", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }
