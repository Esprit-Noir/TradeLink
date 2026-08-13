import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8b5cf6",
}

export const metadata: Metadata = {
  title: {
    default: "TradeLink — Trading Journal",
    template: "%s | TradeLink",
  },
  description:
    "Transform your raw trade data into actionable behavioral coaching. Stop trading your emotions, trade your plan.",
  keywords: ["trading journal", "trade tracker", "trading analytics", "behavioral analysis", "prop firm"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TradeLink",
  },
  applicationName: "TradeLink",
}

import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100`}>
        <ThemeProvider>
          {children}
          <ServiceWorkerRegister />
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
