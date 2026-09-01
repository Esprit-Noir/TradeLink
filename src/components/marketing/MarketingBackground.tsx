"use client"

export function MarketingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(circle at 50% 0%, var(--color-brand-500) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
        }}
      />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  )
}
