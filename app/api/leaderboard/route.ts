import { NextResponse } from "next/server"
import { analyticsService } from "@/shared/services/AnalyticsService"
import { withErrorHandler } from "@/shared/errors/errorHandler"

async function handler() {
  // Récupération du leaderboard via le service analytics
  const leaderboard = await analyticsService.getLeaderboard(10)

  // Formatage pour la compatibilité avec le frontend existant
  const formatted = leaderboard.map((entry) => ({
    userId: entry.userId,
    totalScore: entry.bestScore, // Utiliser le meilleur score comme total
    userName: entry.username || entry.name || "Utilisateur anonyme",
    userImage: null, // Peut être ajouté si nécessaire
    averageScore: entry.averageScore,
    totalAttempts: entry.totalAttempts,
  }))

  return NextResponse.json(formatted)
}

export const GET = withErrorHandler(handler)