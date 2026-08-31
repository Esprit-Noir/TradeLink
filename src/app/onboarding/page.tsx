"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, CheckCircle2, Globe, Target, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

const STEPS = [
  { id: 1, title: "Basic Setup", icon: Globe },
  { id: 2, title: "Trading Goals", icon: Target },
  { id: 3, title: "Risk Profile", icon: ShieldAlert },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    baseCurrency: "USD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dailyGoal: "",
    monthlyGoal: "",
    riskPerTrade: "1", // %
    maxDailyLoss: "3", // %
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleNext = () => setStep(s => Math.min(s + 1, 3))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseCurrency: formData.baseCurrency,
          timezone: formData.timezone,
          dailyGoal: formData.dailyGoal ? Number(formData.dailyGoal) : null,
          monthlyGoal: formData.monthlyGoal ? Number(formData.monthlyGoal) : null,
          riskPrefs: {
            riskPerTradePct: Number(formData.riskPerTrade),
            maxDailyLossPct: Number(formData.maxDailyLoss),
          }
        }),
      })

      if (!res.ok) throw new Error("Failed to save onboarding data")
      
      toast.success("Welcome to TradeLink!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-gray-950)] text-[var(--color-gray-100)] flex items-center justify-center p-4 selection:bg-[var(--color-brand-500)] selection:text-black transition-colors duration-300">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[var(--color-brand-500)]/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-[var(--color-gray-800)] -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[var(--color-brand-500)] -translate-y-1/2 z-0 transition-all duration-500 ease-in-out" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          
          {STEPS.map((s) => {
            const isActive = s.id === step
            const isCompleted = s.id < step
            const Icon = s.icon

            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive ? 'bg-[var(--color-brand-500)] text-white shadow-[0_0_20px_rgba(0,199,88,0.4)]' :
                    isCompleted ? 'bg-[var(--color-brand-500)]/20 text-[var(--color-brand-600)]' :
                    'bg-[var(--color-gray-900)] text-[var(--color-gray-400)] border border-[var(--color-gray-800)]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                </div>
                <div className={`absolute top-16 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                  isActive ? 'text-[var(--color-brand-600)]' :
                  isCompleted ? 'text-[var(--color-gray-400)]' :
                  'text-[var(--color-gray-500)]'
                }`}>
                  {s.title}
                </div>
              </div>
            )
          })}
        </div>

        {/* Card Content */}
        <div className="bg-[var(--color-gray-900)] backdrop-blur-xl border border-[var(--color-gray-800)] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden transition-colors duration-300">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-3 tracking-tight">Welcome to TradeLink</h2>
                  <p className="text-[var(--color-gray-400)]">Let&apos;s set up your core preferences.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-gray-300)] mb-2">Base Currency</label>
                    <select
                      name="baseCurrency"
                      value={formData.baseCurrency}
                      onChange={handleChange}
                      className="w-full bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-xl px-4 py-3.5 text-[var(--color-gray-100)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors appearance-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-gray-300)] mb-2">Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-xl px-4 py-3.5 text-[var(--color-gray-100)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors appearance-none"
                    >
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <p className="text-xs text-[var(--color-gray-500)] mt-2">All your trades will be displayed in this timezone.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-3 tracking-tight">Set Your Goals</h2>
                  <p className="text-[var(--color-gray-400)]">What are you aiming for? We&apos;ll track your progress.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-gray-300)] mb-2">Daily Profit Goal (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)] font-bold">{formData.baseCurrency === "USD" ? "$" : formData.baseCurrency === "EUR" ? "€" : formData.baseCurrency}</span>
                      <input
                        type="number"
                        name="dailyGoal"
                        placeholder="e.g. 500"
                        value={formData.dailyGoal}
                        onChange={handleChange}
                        className="w-full bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--color-gray-100)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-gray-300)] mb-2">Monthly Profit Goal (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)] font-bold">{formData.baseCurrency === "USD" ? "$" : formData.baseCurrency === "EUR" ? "€" : formData.baseCurrency}</span>
                      <input
                        type="number"
                        name="monthlyGoal"
                        placeholder="e.g. 10000"
                        value={formData.monthlyGoal}
                        onChange={handleChange}
                        className="w-full bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--color-gray-100)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-3 tracking-tight">Risk Profile</h2>
                  <p className="text-[var(--color-gray-400)]">Help the AI understand your risk parameters.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-gray-300)] mb-2">Max Risk per Trade (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        name="riskPerTrade"
                        value={formData.riskPerTrade}
                        onChange={handleChange}
                        className="w-full bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-xl px-4 py-3.5 text-[var(--color-gray-100)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)] font-bold">%</span>
                    </div>
                    <p className="text-xs text-[var(--color-gray-500)] mt-2">Recommended: 0.5% - 1.0%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-gray-300)] mb-2">Max Daily Loss Limit (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        name="maxDailyLoss"
                        value={formData.maxDailyLoss}
                        onChange={handleChange}
                        className="w-full bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-xl px-4 py-3.5 text-[var(--color-gray-100)] focus:outline-none focus:border-[var(--color-brand-500)] transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-500)] font-bold">%</span>
                    </div>
                    <p className="text-xs text-[var(--color-gray-500)] mt-2">Recommended: 3.0% - 5.0%</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-12 flex items-center justify-between pt-8 border-t border-[var(--color-gray-800)]">
            {step > 1 ? (
              <button 
                onClick={handlePrev}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-gray-800)] hover:bg-[var(--color-gray-700)] text-[var(--color-gray-300)] font-semibold transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white font-bold transition-colors"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white font-bold transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Finish Setup"}
                {!loading && <CheckCircle2 size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
