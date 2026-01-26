"use client"

import { Header } from "@/components/header"

export function DesktopLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
                {children}
            </main>
            <footer className="border-t border-border/50 py-6 mt-12 glass">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>BibleQuest © 2025 - Maîtrisez la Bible Quiz par Quiz</p>
                </div>
            </footer>
        </div>
    )
}
