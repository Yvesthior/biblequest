import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // 1. Global Stats
    const totalAttempts = await prisma.quizAttempt.count()
    const totalQuizzes = await prisma.quiz.count()
    
    // Count unique users who have played
    const uniquePlayers = await prisma.quizAttempt.groupBy({
      by: ['userId'],
    }).then(res => res.length)

    // 2. Attempts by Category
    // Prisma doesn't support deep relation grouping easily in one go, 
    // so we might need a raw query or fetching quizzes and aggregating.
    // Let's try a cleaner approach: Fetch all quizzes with their attempt counts
    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        _count: {
          select: { attempts: true }
        }
      }
    })

    // Aggregate by Category manually
    const categoryStats: Record<string, number> = {}
    quizzes.forEach(quiz => {
      const cat = quiz.category || "Non classé"
      categoryStats[cat] = (categoryStats[cat] || 0) + quiz._count.attempts
    })

    const attemptsByCategory = Object.entries(categoryStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 3. Top 5 Popular Quizzes
    const topQuizzes = [...quizzes]
      .sort((a, b) => b._count.attempts - a._count.attempts)
      .slice(0, 5)
      .map(q => ({
        name: q.title,
        attempts: q._count.attempts,
        category: q.category
      }))

    // 4. Recent Activity (Last 7 days) - Optional but nice
    // For now, let's stick to the basics requested.

    return NextResponse.json({
      overview: {
        totalAttempts,
        totalQuizzes,
        uniquePlayers,
        completionRate: totalAttempts > 0 ? Math.round((totalAttempts / (uniquePlayers || 1)) * 10) / 10 : 0 // Avg attempts per player
      },
      attemptsByCategory,
      topQuizzes
    })

  } catch (error) {
    console.error("[ADMIN STATS] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
