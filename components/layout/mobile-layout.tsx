"use client"

import { BottomNav } from "@/components/ui/bottom-nav"
import { BookOpen } from "lucide-react"

export function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">
            {/* Mobile Top Bar */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 h-14 flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="font-serif font-bold text-lg tracking-tight">BibleQuest</span>
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 w-full overflow-x-hidden">
                {children}
            </main>

            <BottomNav />
        </div>
    )
}
