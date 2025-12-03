import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const userId = session.user.id

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
    })

    if (attempts.length === 0) {
      return NextResponse.json({
        quizzesCompleted: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        perfectScores: 0,
      })
    }

    const quizzesCompleted = attempts.length
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0)
    const correctAnswers = attempts.reduce((sum, a) => sum + a.score, 0)
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const perfectScores = attempts.filter(a => a.score === a.totalQuestions).length

    return NextResponse.json({
      quizzesCompleted,
      totalQuestions,
      correctAnswers,
      accuracy,
      perfectScores,
    })

  } catch (error) {
    console.error("[API PROFILE STATS] Error fetching stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
