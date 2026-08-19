"use client"

import {
  Brain, BarChart3, Shield, Play, Activity, Clock, AlertTriangle, Eye, LineChart, PieChart, Target, FileText
} from "lucide-react"
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
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 40, damping: 15 }
  }
}

export function MarketingFeatures() {
  return (
    <section className="py-32 bg-[#0a0a0a]" id="features">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-6 text-[10px] font-bold text-[var(--color-brand-500)] uppercase tracking-widest">
            The Arsenal
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Everything You Need to<br />
            <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">Scale Your Edge</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From AI-powered behavioral coaching to real-time risk management — TradeLink gives
            funded traders the tools to pass challenges and keep their accounts alive.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(220px,auto)] gap-4"
        >
          {/* AI Behavioral Coaching - Large */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 md:row-span-2 relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300">
             <div className="absolute -top-[60%] -right-[40%] w-[400px] h-[400px] rounded-full bg-[var(--color-brand-500)] blur-[100px] opacity-10 pointer-events-none" />
             <div className="relative p-8 h-full flex flex-col">
               <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] flex items-center justify-center mb-6">
                 <Brain size={24} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-3">AI Behavioral Coaching</h3>
               <p className="text-gray-400 leading-relaxed mb-8 max-w-md">Detects revenge trading, tilt, overtrading, and emotional spirals before they blow your account. Our AI cross-references your entry timing, position sizing, and P&L patterns to identify destructive behaviors.</p>
               
               <div className="flex flex-col gap-3 mb-8">
                 <div className="flex items-center gap-3 text-sm text-gray-300"><AlertTriangle size={16} className="text-amber-500" /> Real-time tilt detection</div>
                 <div className="flex items-center gap-3 text-sm text-gray-300"><Eye size={16} className="text-blue-500" /> Pattern recognition across 50+ metrics</div>
                 <div className="flex items-center gap-3 text-sm text-gray-300"><FileText size={16} className="text-purple-500" /> Personalized weekly action plans</div>
               </div>
               
               <div className="mt-auto flex flex-col gap-3 relative">
                 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-4">
                   <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 animate-pulse" />
                   <div>
                     <div className="text-red-400 font-bold text-sm mb-1">Tilt Warning</div>
                     <div className="text-xs text-red-200/70">You&apos;ve lost 3 trades in 15 mins. Your avg position size just increased 2.4x. Step away.</div>
                   </div>
                 </div>
                 <div className="p-4 rounded-xl bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 flex gap-4">
                   <div className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] mt-1.5 flex-shrink-0" />
                   <div>
                     <div className="text-[var(--color-brand-500)] font-bold text-sm mb-1">Insight</div>
                     <div className="text-emerald-200/70 text-xs">Your win rate drops 18% after 2pm London. Consider closing positions earlier.</div>
                   </div>
                 </div>
               </div>
             </div>
          </motion.div>

          {/* Deep Analytics - Medium */}
          <motion.div variants={itemVariants} className="col-span-1 md:row-span-2 relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300">
             <div className="absolute -top-[60%] -right-[40%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-[100px] opacity-10 pointer-events-none" />
             <div className="relative p-8 h-full flex flex-col">
               <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                 <BarChart3 size={24} />
               </div>
               <h3 className="text-xl font-bold text-white mb-3">50+ Quant Reports</h3>
               <p className="text-gray-400 text-sm leading-relaxed">Every metric a professional quant would track — profit factor, expectancy, Sortino ratio, drawdown analysis, hourly performance, day-of-week breakdowns, and more.</p>
               
               <div className="mt-auto pt-8 flex items-end gap-1.5 h-32 opacity-80">
                  <div className="w-full bg-blue-500/30 rounded-t-sm h-[30%]" />
                  <div className="w-full bg-blue-500/40 rounded-t-sm h-[55%]" />
                  <div className="w-full bg-blue-500/35 rounded-t-sm h-[45%]" />
                  <div className="w-full bg-blue-500/60 rounded-t-sm h-[80%]" />
                  <div className="w-full bg-blue-500/50 rounded-t-sm h-[65%]" />
                  <div className="w-full bg-[var(--color-brand-500)] rounded-t-sm h-[95%]" />
                  <div className="w-full bg-blue-500/55 rounded-t-sm h-[70%]" />
                  <div className="w-full bg-blue-500/40 rounded-t-sm h-[50%]" />
               </div>
             </div>
          </motion.div>

          {/* Trade Replay - Wide */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-3 relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300">
             <div className="absolute -bottom-[60%] -left-[20%] w-[500px] h-[500px] rounded-full bg-purple-500 blur-[120px] opacity-10 pointer-events-none" />
             <div className="relative p-8 flex flex-col md:flex-row gap-8 items-center h-full">
               <div className="flex-1">
                 <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                   <Play size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">Trade Replay</h3>
                 <p className="text-gray-400 leading-relaxed mb-6">Rewatch your entries and exits tick-by-tick on real charts. See exactly where you entered, where you exited, and where you should have held. Learn from mistakes instantly — not months later.</p>
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-3 text-sm text-gray-300"><Activity size={16} className="text-emerald-400" /> Real candlestick data from Yahoo Finance</div>
                   <div className="flex items-center gap-3 text-sm text-gray-300"><Clock size={16} className="text-blue-400" /> Adjustable playback speed</div>
                 </div>
               </div>
               
               <div className="w-full md:w-[45%] aspect-video bg-black/50 border border-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center group-hover:border-gray-600 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm cursor-pointer group-hover:bg-[var(--color-brand-500)] group-hover:text-black transition-all">
                    <Play size={24} className="fill-current" />
                  </div>
                  {/* Abstract Chart Background */}
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,80 L10,70 L20,75 L30,50 L40,60 L50,30 L60,40 L70,20 L80,35 L90,10 L100,15" fill="none" stroke="currentColor" strokeWidth="1" className="text-purple-500" />
                  </svg>
               </div>
             </div>
          </motion.div>

          {/* Prop Firm Tracking - Small */}
          <motion.div variants={itemVariants} className="col-span-1 relative bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center justify-center group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Target size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Prop Firm Tracking</h3>
            <p className="text-gray-400 text-xs mb-4">Real-time drawdown, daily loss, and profit target tracking.</p>
            <div className="px-3 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-full mt-auto">Pass rate: 73%</div>
          </motion.div>

          {/* Risk Management - Small */}
          <motion.div variants={itemVariants} className="col-span-1 relative bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center justify-center group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 text-white flex items-center justify-center mb-4">
              <Shield size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Risk Management</h3>
            <p className="text-gray-400 text-xs mb-4">Auto-enforced risk rules. Never exceed your max risk per trade again.</p>
            <div className="px-3 py-1 bg-gray-800 text-gray-300 text-[10px] font-bold uppercase tracking-wider rounded-full mt-auto">1% risk per trade</div>
          </motion.div>
          
          {/* Setup Tagging - Small */}
          <motion.div variants={itemVariants} className="col-span-1 relative bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center justify-center group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
              <PieChart size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Setup Tagging</h3>
            <p className="text-gray-400 text-xs">Tag every trade. Rank your setups by profit factor to find your true edge.</p>
          </motion.div>

          {/* Equity Curve - Small */}
          <motion.div variants={itemVariants} className="col-span-1 relative bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center justify-center group hover:-translate-y-1 hover:border-gray-700 transition-all duration-300 md:hidden">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <LineChart size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Equity Curve</h3>
            <p className="text-gray-400 text-xs">Track your account growth over time.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
