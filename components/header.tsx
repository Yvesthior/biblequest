"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BookOpen, LogIn, LogOut, User, Settings, Menu, Trophy, Flag } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:inline">BibleQuest</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/leaderboard">Classement</Link>
            </Button>
            <div className="h-6 border-l border-border/50" />
            <ThemeToggle />
            
            {status === "loading" ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
            ) : session ? (
              <>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline">Profil</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link href="/feedback">
                    <Flag className="h-4 w-4" />
                    <span className="hidden lg:inline">Signaler</span>
                  </Link>
                </Button>
                {session.user?.role === "ADMIN" && (
                  <Button asChild variant="ghost" size="sm" className="gap-2">
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
                      <span className="hidden lg:inline">Admin</span>
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={() => signOut()} 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Déconnexion</span>
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => signIn()} 
                size="sm" 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <LogIn className="h-4 w-4" />
                Connexion
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 space-y-2 border-t border-border/50 pt-4">
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/leaderboard">
                <Trophy className="h-4 w-4" />
                Classement
              </Link>
            </Button>
            <div className="border-b border-border/50" />
            {status === "loading" ? (
              <div className="h-9 w-full bg-muted animate-pulse rounded-lg" />
            ) : session ? (
              <>
                <Button 
                  asChild 
                  variant="ghost" 
                  className="w-full justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    Profil
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="ghost" 
                  className="w-full justify-start gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/feedback">
                    <Flag className="h-4 w-4" />
                    Signaler une erreur
                  </Link>
                </Button>
                {session.user?.role === "ADMIN" && (
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }} 
                  variant="ghost" 
                  className="w-full justify-start gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  signIn()
                  setMobileMenuOpen(false)
                }} 
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <LogIn className="h-4 w-4" />
                Connexion
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}