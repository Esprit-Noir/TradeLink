"use client"

import {
  Brain, BarChart3, Shield, Play, Activity, Clock, AlertTriangle, Eye, LineChart, PieChart, Target, FileText, LayoutDashboard, Zap
} from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, Variants } from "framer-motion"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 40, damping: 15 }
  }
}

export function MarketingFeatures() {
  const t = useTranslations("Marketing.Features")
  return (
    <section className="py-32 bg-[#050505] relative overflow-hidden" id="features">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--color-brand-500)]/10 blur-[150px] pointer-events-none rounded-[100%]" />
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <Zap size={12} className="text-[var(--color-brand-500)]" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t("badge")}</span>
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tighter">
            {t("title1")} <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,199,88,0.3)]">{t("title2")}</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Du coaching comportemental par IA à la gestion des risques en temps réel — TradeLink donne
            aux traders financés les outils pour réussir les challenges et préserver leurs comptes.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(280px,auto)] gap-6"
        >
          {/* AI Behavioral Coaching - Large */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 md:row-span-2 relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-[var(--color-brand-500)]/50 transition-all duration-500 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_40px_rgba(0,199,88,0.15)]">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute -top-[60%] -right-[40%] w-[400px] h-[400px] rounded-full bg-[var(--color-brand-500)] blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
             
             <div className="relative p-10 h-full flex flex-col">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)]/20 to-[var(--color-brand-500)]/5 border border-[var(--color-brand-500)]/30 text-[var(--color-brand-500)] flex items-center justify-center mb-8 shadow-inner shadow-[var(--color-brand-500)]/20">
                 <Brain size={28} />
               </div>
               <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{t("aiTitle")}</h3>
               <p className="text-gray-400 leading-relaxed mb-10 max-w-lg font-medium text-lg">{t("aiDesc")}</p>
               
               <div className="flex flex-col gap-4 mb-8">
                 <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><AlertTriangle size={18} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> {t("aiF1")}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><Eye size={18} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {t("aiF2")}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><FileText size={18} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> {t("aiF3")}</div>
               </div>
               
               <div className="mt-auto pt-8 -mx-10 -mb-10 relative overflow-hidden rounded-b-3xl">
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/dashboard-screens/dash2.png" alt="Behavioral Insights" className="w-full h-auto object-cover object-top opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" style={{ transform: 'translateY(-5%)' }} />
               </div>
             </div>
          </motion.div>

          {/* Deep Analytics - Medium */}
          <motion.div variants={itemVariants} className="col-span-1 md:row-span-2 relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col">
             <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute -top-[60%] -right-[40%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
             
             <div className="relative p-10 flex flex-col flex-1">
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-8 shadow-inner shadow-blue-500/20">
                 <BarChart3 size={28} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{t("quantTitle")}</h3>
               <p className="text-gray-400 leading-relaxed mb-6 font-medium">{t("quantDesc")}</p>
             </div>
             
             <div className="mt-auto relative overflow-hidden rounded-b-3xl">
               <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src="/dashboard-screens/dash4.png" alt="Advanced Statistics" className="w-full h-auto object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
             </div>
          </motion.div>

          {/* Accounts & Prop Firms - Wide */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-3 relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]">
             <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute -bottom-[60%] -left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-500 blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
             
             <div className="relative p-10 flex flex-col md:flex-row gap-12 items-center h-full">
               <div className="flex-1 z-20">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-8 shadow-inner shadow-emerald-500/20">
                   <Target size={28} />
                 </div>
                 <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{t("propTitle")}</h3>
                 <p className="text-gray-400 leading-relaxed mb-8 font-medium text-lg">{t("propDesc")}</p>
                 <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><Activity size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {t("propF1")}</div>
                   <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><Shield size={18} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {t("propF2")}</div>
                 </div>
               </div>
               
               <div className="w-full md:w-[55%] rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/dashboard-screens/dash3.png" alt="Prop Firm Tracker" className="w-full h-auto object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
               </div>
             </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
