"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, User, BookOpen } from "lucide-react"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        {
            label: "Accueil",
            href: "/",
            icon: Home,
        },
        {
            label: "Quiz",
            href: "/quizzes",
            icon: BookOpen,
        },
        {
            label: "Classement",
            href: "/leaderboard",
            icon: Trophy,
        },
        {
            label: "Profil",
            href: "/profile",
            icon: User,
        },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
            <nav className="container mx-auto px-4">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex flex-col items-center justify-center w-full h-full gap-1
                  transition-colors duration-200
                  ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                `}
                            >
                                <div className={`
                  p-1 rounded-xl transition-all duration-200
                  ${isActive ? "bg-primary/10" : "bg-transparent"}
                `}>
                                    <Icon className={`h-6 w-6 ${isActive ? "fill-primary/20" : ""}`} />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
