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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030304" },
    { color: "#fafafa" },
  ],
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
      { url: "/icon.png?v=2" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
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
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-gray-100`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <ServiceWorkerRegister />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'custom-toast',
              style: {
                background: 'color-mix(in srgb, var(--color-gray-900) 80%, transparent)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--color-gray-800)',
                color: 'var(--color-gray-100)',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                padding: '16px',
                fontSize: '0.85rem'
              }
            }}
          />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
