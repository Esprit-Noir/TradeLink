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

export default function HomePage() {
  return (
    <div className="marketing-page">
      <MarketingAnimations />
      <MarketingNav />
      <MarketingHero />
      <MarketingHowItWorks />
      <MarketingFeatures />
      <MarketingIntegrations />
      <MarketingPricing />
      <MarketingTestimonials />
      <MarketingFaq />
      <MarketingCta />
      <MarketingFooter />
    </div>
  )
}
