import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "TradeLink — Trading Journal",
    template: "%s | TradeLink",
  },
  description:
    "Transform your raw trade data into actionable behavioral coaching. Stop trading your emotions, trade your plan.",
  keywords: ["trading journal", "trade tracker", "trading analytics", "behavioral analysis", "prop firm"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100`}>
        {children}
      </body>
    </html>
  )
}
