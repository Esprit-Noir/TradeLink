import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MarketingHero } from "@/components/marketing/MarketingHero"
import { MarketingHowItWorks } from "@/components/marketing/MarketingHowItWorks"
import { MarketingFeatures } from "@/components/marketing/MarketingFeatures"
import { MarketingIntegrations } from "@/components/marketing/MarketingIntegrations"
import { MarketingPricing } from "@/components/marketing/MarketingPricing"
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials"
import { MarketingFaq } from "@/components/marketing/MarketingFaq"
import { MarketingCta } from "@/components/marketing/MarketingCta"
import { MarketingNav } from "@/components/marketing/MarketingNav"
import { MarketingFooter } from "@/components/marketing/MarketingFooter"
import { MarketingAnimations } from "@/components/marketing/MarketingAnimations"

export const metadata = {
  title: "TradeLink — AI Trading Journal & Performance Analytics",
  description:
    "The professional trading journal that analyzes your performance, detects destructive patterns, and helps you build unbreakable discipline. Free to start.",
}

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session?.user?.id

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" }
  })

  const serializedPlans = plans.map(p => ({
    ...p,
    price: p.price.toNumber()
  }))

  return (
    <div className="dark force-dark bg-black text-white min-h-screen font-sans selection:bg-[var(--color-brand-500)] selection:text-black">
      <MarketingAnimations />
      <MarketingNav isLoggedIn={isLoggedIn} />
      <MarketingHero isLoggedIn={isLoggedIn} />
      <MarketingHowItWorks />
      <MarketingFeatures />
      <MarketingIntegrations />
      <MarketingPricing plans={serializedPlans as any} />
      <MarketingTestimonials />
      <MarketingFaq />
      <MarketingCta isLoggedIn={isLoggedIn} />
      <MarketingFooter />
    </div>
  )
}
