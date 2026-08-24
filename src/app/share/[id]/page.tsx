import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/formatters"
import { BadgeCheck, Target, TrendingUp, AlertTriangle } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const shareLink = await prisma.shareLink.findUnique({
    where: { id },
  })

  if (!shareLink || !shareLink.isPublic) {
    return { title: "TradeLink - Shared Result Not Found" }
  }

  // The opengraph-image.tsx route handles the dynamic image generation
  return {
    title: "TradeLink — Shared Performance",
    description: "View this verified trading performance on TradeLink.",
    openGraph: {
      title: "TradeLink Verified Performance",
      description: "View this verified trading performance on TradeLink.",
    },
    twitter: {
      card: "summary_large_image",
      title: "TradeLink Verified Performance",
      description: "View this verified trading performance on TradeLink.",
    }
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const shareLink = await prisma.shareLink.findUnique({
    where: { id },
    include: { user: true }
  })

  if (!shareLink || !shareLink.isPublic) {
    notFound()
  }

  // Update view count silently
  await prisma.shareLink.update({
    where: { id },
    data: { views: { increment: 1 } }
  }).catch(() => {})

  let content = null

  if (shareLink.entityType === "challenge") {
    const challenge = await prisma.propChallenge.findUnique({
      where: { id: shareLink.entityId },
      include: { template: true }
    })
    
    if (!challenge) notFound()

    const isPassed = challenge.status === 'passed'
    const isFailed = challenge.status === 'breached' || challenge.status === 'failed'

    content = (
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 mb-6 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] rounded-full flex items-center justify-center">
            {isPassed ? <BadgeCheck size={40} /> : isFailed ? <AlertTriangle size={40} className="text-red-500" /> : <TrendingUp size={40} />}
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            {shareLink.user.name || "A trader"}'s Performance
          </h1>
          <p className="text-xl text-gray-400">
            {challenge.template.firmName} — {challenge.template.programName}
          </p>
        </div>

        <div className="glass-panel p-8 md:p-10 relative overflow-hidden rounded-2xl border border-gray-800">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Target size={120} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
              <div className="text-sm text-gray-500 mb-1 font-medium">Status</div>
              <div className="text-2xl font-bold flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                  isPassed ? 'bg-green-500/20 text-green-400' :
                  isFailed ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {challenge.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1 font-medium">Account Size</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(Number(challenge.initialBalance), "USD")}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1 font-medium">Current Balance</div>
              <div className={`text-2xl font-bold ${Number(challenge.currentBalance) > Number(challenge.initialBalance) ? 'text-green-400' : 'text-white'}`}>
                {formatCurrency(Number(challenge.currentBalance), "USD")}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1 font-medium">Phase</div>
              <div className="text-2xl font-bold text-white capitalize">
                {challenge.phase.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-500 font-mono">
              Verified by TradeLink
            </div>
            <div className="text-sm text-gray-400">
              {new Date(challenge.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    content = <div className="text-gray-400">Content type not supported yet.</div>
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[var(--color-brand-500)] selection:text-black">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-dark.png" alt="TradeLink" className="h-6" />
          </div>
          <div>
            <a href="/" className="text-sm font-medium hover:text-white text-gray-400 transition-colors">
              Create your own journal &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20 md:py-32 flex justify-center">
        {content}
      </main>
    </div>
  )
}
