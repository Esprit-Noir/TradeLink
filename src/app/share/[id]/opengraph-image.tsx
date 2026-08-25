import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const alt = 'TradeLink Shared Performance'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const { id } = params
  
  // NOTE: Prisma via edge runtime can be tricky in some setups, but with Next.js 14+ 
  // and Prisma Accelerate/neon it works. Alternatively, if we get errors, we'd fetch via API.
  // For standard Vercel deploy, it might need to run in node runtime.
  // Let's set it to use the standard node runtime if needed by dropping `runtime = 'edge'`
  // Actually, wait, let me use the standard node runtime by NOT exporting runtime='edge'.
  
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!shareLink || !shareLink.isPublic) {
      return new Response('Not found', { status: 404 })
    }

    if (shareLink.entityType === "challenge") {
      const challenge = await prisma.propChallenge.findUnique({
        where: { id: shareLink.entityId },
        include: { template: true }
      })

      if (!challenge) {
        return new Response('Not found', { status: 404 })
      }

      const isPassed = challenge.status === 'passed'
      const isFailed = challenge.status === 'breached' || challenge.status === 'failed'

      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000000',
              backgroundImage: 'linear-gradient(to bottom right, #000000, #111827)',
              fontFamily: 'sans-serif',
              color: 'white',
              position: 'relative',
              padding: '60px',
            }}
          >
            {/* Background elements */}
            <div
              style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '60%',
                height: '60%',
                background: isPassed ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)' : isFailed ? 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)',
              }}
            />
            
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
              <div style={{ display: 'flex', fontSize: '36px', fontWeight: 'bold', color: 'white', letterSpacing: '-1px' }}>
                TradeLink
              </div>
              <div style={{ display: 'flex', padding: '8px 24px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '24px', fontWeight: 'bold', color: isPassed ? '#4ade80' : isFailed ? '#f87171' : '#facc15', textTransform: 'uppercase' }}>
                {challenge.status}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: '40px 0' }}>
              <div style={{ fontSize: '32px', color: '#9ca3af', marginBottom: '16px' }}>
                {shareLink.user.name || "A trader"}&apos;s Performance
              </div>
              <div style={{ fontSize: '72px', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1.1', marginBottom: '16px' }}>
                {challenge.template.firmName}
              </div>
              <div style={{ fontSize: '40px', color: '#d1d5db', fontWeight: '500' }}>
                {challenge.template.programName}
              </div>
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center', gap: '40px', marginTop: 'auto', backgroundColor: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '12px' }}>Account Size</span>
                <span style={{ fontSize: '48px', fontWeight: 'bold' }}>${Number(challenge.initialBalance).toLocaleString()}</span>
              </div>
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '12px' }}>Current Balance</span>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: Number(challenge.currentBalance) > Number(challenge.initialBalance) ? '#4ade80' : 'white' }}>${Number(challenge.currentBalance).toLocaleString()}</span>
              </div>
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '12px' }}>Phase</span>
                <span style={{ fontSize: '48px', fontWeight: 'bold', textTransform: 'capitalize' }}>{challenge.phase.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        ),
        { ...size }
      )
    }

    return new Response('Not found', { status: 404 })
  } catch (e) {
    console.error(e)
    return new Response('Failed to generate image', { status: 500 })
  }
}
