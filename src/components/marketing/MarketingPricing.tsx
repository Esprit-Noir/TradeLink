"use client"

import Link from "next/link"
import { Check, Sparkles, X } from "lucide-react"
import { motion, Variants } from "framer-motion"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For beginners finding their footing. No credit card required.",
    features: [
      { text: "1 trading account", included: true },
      { text: "Basic P&L analytics", included: true },
      { text: "Calendar view", included: true },
      { text: "Manual trade entry", included: true },
      { text: "CSV import", included: true },
      { text: "AI Behavioral Coaching", included: false },
      { text: "Trade Replay", included: false },
      { text: "Prop Firm Tracking", included: false },
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro Trader",
    price: "$29",
    period: "/month",
    description: "The full arsenal for serious traders. Pass your challenge faster.",
    features: [
      { text: "Unlimited accounts & brokers", included: true },
      { text: "AI Behavioral Coaching", included: true },
      { text: "Trade Replay on real charts", included: true },
      { text: "Prop Firm Tracking", included: true },
      { text: "Advanced Risk Simulator", included: true },
      { text: "50+ Quant Reports", included: true },
      { text: "Monte Carlo Simulations", included: true },
      { text: "Priority Support", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
  },
  {
    name: "Team & Firm",
    price: "$49",
    period: "/month",
    description: "For prop firms, mentors, and trading communities.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 20 team members", included: true },
      { text: "Team Dashboard & Leaderboards", included: true },
      { text: "Mentor review tools", included: true },
      { text: "Custom branding", included: true },
      { text: "API Access", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "SSO & Admin Controls", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

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

export function MarketingPricing() {
  return (
    <section id="pricing" className="py-32 bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-6 text-[10px] font-bold text-[var(--color-brand-500)] uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            An Investment in Your <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">Trading Edge</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Cheaper than a single stop-loss hit. Cancel anytime, no contracts.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
        >
          {PLANS.map((plan, i) => (
            <motion.div 
              variants={itemVariants}
              key={i} 
              className={`relative flex flex-col bg-gray-900 border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${plan.popular ? 'border-[var(--color-brand-500)] md:-mt-4 md:mb-[-1rem] z-10' : 'border-gray-800'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-brand-500)] text-black text-[10px] font-bold uppercase tracking-wider rounded-full">
                    <Sparkles size={12} /> Most Popular
                  </div>
                </div>
              )}
              
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm font-medium text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mb-6 h-10">{plan.description}</p>
                
                <div className="w-full h-px bg-gray-800 mb-6" />
                
                <ul className="flex flex-col gap-4 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-3 text-sm ${f.included ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${f.included ? (plan.popular ? 'bg-[var(--color-brand-500)] text-black' : 'bg-gray-800 text-gray-300') : 'bg-transparent text-gray-600'}`}>
                        {f.included ? <Check size={12} strokeWidth={3} /> : <X size={12} />}
                      </div>
                      {f.text}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto pt-4">
                  <Link 
                    href="/register" 
                    className={`flex items-center justify-center w-full py-3 px-4 rounded-lg font-semibold transition-colors ${plan.popular ? 'bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black' : 'bg-transparent border border-gray-700 hover:bg-gray-800 text-white'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-sm text-gray-500 mt-16 font-medium">
          All paid plans include a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
