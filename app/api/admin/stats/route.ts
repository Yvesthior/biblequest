import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { QuizAttempt, Quiz } from "@/models"
import { Sequelize } from "sequelize"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // 1. Global Stats
    const totalAttempts = await QuizAttempt.count()
    const totalQuizzes = await Quiz.count()

    // Count unique users who have played
    // Sequelize distinct count
    const uniquePlayers = await QuizAttempt.count({
      distinct: true,
      col: 'userId'
    })

    // 2. Attempts by Category
    // We fetch all quizzes and group by category in JS, or aggregate in DB.
    // Let's fetch quizzes with their attempt counts (Question: does QuizAttempt have a direct relation to Category? No, it's on Quiz).
    // So we need: Select Category, Count(Attempts).
    // This requires a join.
    /*
      SELECT Quiz.category, COUNT(QuizAttempt.id) 
      FROM Quiz 
      LEFT JOIN QuizAttempt ON Quiz.id = QuizAttempt.quizId 
      GROUP BY Quiz.category
    */
    // Since Sequelize grouping with relations can be verbose, let's stick to the previous strategy:
    // Fetch quizzes with counts and aggregate in memory (simpler migration).

    const quizzes = await Quiz.findAll({
      attributes: {
        include: [
          [Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM quizattempt AS qa 
            WHERE qa.quizId = Quiz.id
          )`), 'attemptCount']
        ]
      },
      raw: true, // simplified structure
    })

    // Aggregate by Category manually
    const categoryStats: Record<string, number> = {}
    quizzes.forEach((quiz: any) => {
      const cat = quiz.category || "Non classé"
      const count = parseInt(quiz.attemptCount || 0)
      categoryStats[cat] = (categoryStats[cat] || 0) + count
    })

    const attemptsByCategory = Object.entries(categoryStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 3. Top 5 Popular Quizzes
    const topQuizzes = [...quizzes]
      .map((q: any) => ({
        name: q.title,
        attempts: parseInt(q.attemptCount || 0),
        category: q.category
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        totalAttempts,
        totalQuizzes,
        uniquePlayers,
        completionRate: totalAttempts > 0 ? Math.round((totalAttempts / (uniquePlayers || 1)) * 10) / 10 : 0
      },
      attemptsByCategory,
      topQuizzes
    })

  } catch (error) {
    console.error("[ADMIN STATS] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
