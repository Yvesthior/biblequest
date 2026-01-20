import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { quizAttemptRepository } from "@/shared/repositories/QuizAttemptRepository"
import { withErrorHandler, requireAuth } from "@/shared/errors/errorHandler"

async function handler() {
  const session = await auth()
  const userId = requireAuth(session)

  // Récupération des statistiques via le repository
  const stats = await quizAttemptRepository.getUserStats(userId)

  // Calcul des statistiques supplémentaires
  const attempts = await quizAttemptRepository.findByUserId(userId, 1000) // Récupérer toutes les tentatives pour les stats

  const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0)
  const correctAnswers = attempts.reduce((sum, a) => sum + a.score, 0)
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const perfectScores = attempts.filter(a => a.score === a.totalQuestions).length

  return NextResponse.json({
    quizzesCompleted: stats.totalAttempts,
    totalQuestions,
    correctAnswers,
    accuracy,
    perfectScores,
    averageScore: Math.round(stats.averageScore),
    bestScore: stats.bestScore,
  })
}

export const GET = withErrorHandler(handler)
