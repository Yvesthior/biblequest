import type React from "react"
import type { Metadata } from "next"
import { Crimson_Text, Inter } from "next/font/google"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import { Header } from "@/components/header"
import "./globals.css"
import { Suspense } from "react"

const crimsonText = Crimson_Text({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BibleQuest - Maîtrisez la Bible Quiz par Quiz",
  description: "Apprenez la Bible en vous amusant avec des quiz interactifs. Chaque question est accompagnée de références et d'explications détaillées.",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${crimsonText.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col bg-background">
            <Suspense fallback={<div>Loading...</div>}>
              <Header />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-border/50 py-6 mt-12 glass">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                  <p>BibleQuest © 2025 - Maîtrisez la Bible Quiz par Quiz</p>
                </div>
              </footer>
            </Suspense>
          </div>
        </Providers>
        <Analytics />
        <GoogleAnalytics gaId="G-EBK0XRYDFQ" />
      </body>
    </html>
  )
}
