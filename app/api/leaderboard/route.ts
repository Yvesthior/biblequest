import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const topUsers = await prisma.quizAttempt.groupBy({
      by: ["userId"],
      _sum: {
        score: true,
      },
      orderBy: {
        _sum: {
          score: "desc",
        },
      },
      take: 10,
    })

    // Get user details for the top users
    const userIds = topUsers.map((u) => u.userId)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        username: true, // Fetch username
        image: true,
      },
    })

    // Create a map for quick lookup
    const userMap = new Map(users.map((u) => [u.id, u]))

    const leaderboard = topUsers.map((entry) => {
      const user = userMap.get(entry.userId)
      // Prioritize username, then name, then "Anonyme"
      const displayName = user?.username || user?.name || "Utilisateur anonyme"
      
      return {
        userId: entry.userId,
        totalScore: entry._sum.score ?? 0,
        userName: displayName,
        userImage: user?.image,
      }
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("[API LEADERBOARD] Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    )
  }
}