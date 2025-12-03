"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { ThemeProviderFix } from "@/components/theme-provider-fix"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProviderFix>
        {children}
      </ThemeProviderFix>
    </SessionProvider>
  )
}
