"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface LeaderboardEntry {
  userId: string
  totalScore: number
  userName: string
  userImage: string | null
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard")
        const data = await response.json()
        setLeaderboard(data)
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const getMedal = (rank: number) => {
    if (rank === 0) return "🥇"
    if (rank === 1) return "🥈"
    if (rank === 2) return "🥉"
    return rank + 1
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <CardTitle className="text-2xl">Classement</CardTitle>
              <CardDescription>Top 10 des joueurs avec le meilleur score total</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Rang</TableHead>
                  <TableHead>Joueur</TableHead>
                  <TableHead className="text-right">Score Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <TableRow key={entry.userId}>
                      <TableCell className="font-medium text-lg text-center">{getMedal(index)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={entry.userImage ?? undefined} alt={entry.userName} />
                            <AvatarFallback>{entry.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{entry.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">{entry.totalScore}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Aucune donnée de classement disponible pour le moment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background/50">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))
            ) : leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`
                      flex items-center gap-4 p-4 rounded-2xl border transition-all
                      ${index < 3 ? 'glass-card border-primary/20' : 'bg-background/50 border-border/50'}
                    `}
                >
                  <div className={`
                      w-10 h-10 flex items-center justify-center font-bold text-lg rounded-full shrink-0
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      index === 1 ? 'bg-slate-400/20 text-slate-600' :
                        index === 2 ? 'bg-amber-700/20 text-amber-700' :
                          'bg-muted text-muted-foreground'}
                    `}>
                    {index < 3 ? getMedal(index) : index + 1}
                  </div>

                  <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                    <AvatarImage src={entry.userImage ?? undefined} alt={entry.userName} />
                    <AvatarFallback>{entry.userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{entry.userName}</p>
                    <p className="text-xs text-muted-foreground">Rang #{index + 1}</p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xl text-primary">{entry.totalScore}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Points</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune donnée disponible.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
