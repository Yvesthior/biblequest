"use client"

import { MobileLayout } from "./mobile-layout"
import { DesktopLayout } from "./desktop-layout"

/**
 * AppShell handles the responsive layout switching using pure CSS.
 * This approach is robust against hydration mismatches and prevents FOUC.
 * 
 * - < md (768px): MobileLayout is shown
 * - >= md (768px): DesktopLayout is shown
 */
export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Mobile Layout: visible only on small screens */}
            <div className="block md:hidden">
                <MobileLayout>{children}</MobileLayout>
            </div>

            {/* Desktop/Tablet Layout: visible only on medium screens and up */}
            <div className="hidden md:block">
                <DesktopLayout>{children}</DesktopLayout>
            </div>
        </>
    )
}
