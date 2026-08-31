"use client"

import { useState } from "react"
import { Check, X, Sparkles } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { CryptoCheckoutModal } from "./CryptoCheckoutModal"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 15 }
  }
}

type DbPlan = {
  id: string
  name: string
  price: number
  maxAccounts: number
  maxTradesPerMonth: number | null
  backtestAccess: boolean
  features: Record<string, boolean>
}

export function BillingClient({ plans, currentPlanId }: { plans: DbPlan[], currentPlanId?: string }) {
  const [checkoutPlan, setCheckoutPlan] = useState<DbPlan | null>(null)

  const displayPlans = plans.map(p => {
    const isCurrent = p.id === currentPlanId
    const isPro = p.name.toLowerCase() === "pro"
    const isElite = p.name.toLowerCase() === "elite"
    
    const featuresList = [
      { text: p.maxAccounts >= 10 ? "Unlimited accounts" : `${p.maxAccounts} trading account${p.maxAccounts > 1 ? 's' : ''}`, included: true },
      { text: p.maxTradesPerMonth ? `Up to ${p.maxTradesPerMonth} trades/mo` : "Unlimited trades", included: true },
      { text: "Basic P&L analytics", included: true },
      { text: "CSV import & manual entry", included: true },
      { text: "Advanced Stats & Insights", included: !!p.features?.advancedStats },
      { text: "Trade Replay Simulator", included: !!p.features?.replayAccess || p.backtestAccess },
      { text: "Prop Firm Tracking", included: !!p.features?.propFirmAccess },
    ]

    return {
      ...p,
      priceFormatted: `$${p.price.toString().replace(/\.00$/, '')}`,
      period: "/month",
      description: isElite ? "The full arsenal for serious traders and prop firm challenges." : isPro ? "Advanced tools to accelerate your trading edge." : "For beginners finding their footing and journaling trades.",
      featuresList,
      popular: isPro,
      isCurrent
    }
  })

  return (
    <>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start justify-center pt-8"
      >
        {displayPlans.map((plan) => (
          <motion.div 
            variants={itemVariants}
            key={plan.id} 
            className={`relative flex flex-col border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
              plan.isCurrent ? 'z-20' : 
              plan.popular ? 'md:-mt-4 md:mb-[-1rem] z-10' : ''
            }`}
            style={{ 
              background: 'var(--color-gray-900)', 
              borderColor: plan.isCurrent ? 'var(--color-brand-500)' : plan.popular ? 'var(--color-gray-600)' : 'var(--color-gray-800)',
              boxShadow: plan.isCurrent ? '0 0 40px rgba(0,199,88,0.15)' : 'none'
            }}
          >
            {plan.isCurrent && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-brand-500)] text-black text-[11px] font-bold uppercase tracking-wider rounded-full">
                  <Check size={12} strokeWidth={3} /> Active Plan
                </div>
              </div>
            )}
            {!plan.isCurrent && plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full"
                  style={{ background: 'var(--color-gray-800)', border: '1px solid var(--color-gray-600)', color: 'var(--color-gray-100)' }}
                >
                  <Sparkles size={12} /> Most Popular
                </div>
              </div>
            )}
            
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-gray-100)' }}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold" style={{ color: 'var(--color-gray-100)' }}>{plan.priceFormatted}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-gray-400)' }}>{plan.period}</span>
              </div>
              <p className="text-sm mb-6 h-10" style={{ color: 'var(--color-gray-400)' }}>{plan.description}</p>
              
              <div className="w-full h-px mb-6" style={{ background: 'var(--color-gray-800)' }} />
              
              <ul className="flex flex-col gap-4 mb-8">
                {plan.featuresList.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm" style={{ color: f.included ? 'var(--color-gray-300)' : 'var(--color-gray-600)' }}>
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: f.included ? (plan.isCurrent ? 'var(--color-brand-500)' : 'var(--color-gray-800)') : 'transparent',
                        color: f.included ? (plan.isCurrent ? '#000' : 'var(--color-gray-300)') : 'var(--color-gray-600)'
                      }}
                    >
                      {f.included ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto pt-4">
                <button 
                  onClick={() => setCheckoutPlan(plan)}
                  disabled={plan.isCurrent}
                  className={`flex items-center justify-center w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.isCurrent 
                      ? 'bg-transparent border border-[var(--color-brand-500)] text-[var(--color-brand-500)]' 
                      : 'bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black'
                  }`}
                >
                  {plan.isCurrent ? "Current Plan" : "Subscribe with Crypto"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {checkoutPlan && (
        <CryptoCheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </>
  )
}
