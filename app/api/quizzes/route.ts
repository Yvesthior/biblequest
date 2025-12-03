import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 12
    const category = searchParams.get("category")
    const difficulty = searchParams.get("difficulty")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    // Build the where clause
    const where: any = {}

    if (category && category !== "all") {
      where.category = category
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty
    }

    if (search) {
      where.OR = [
        { title: { contains: search } }, // Case-insensitive by default in some DBs, but explicit mode might be needed for Postgres if we were using it. MySQL default collation is usually case-insensitive.
        { description: { contains: search } },
      ]
    }

    // Execute transaction to get count and data in parallel
    const [total, quizzes] = await prisma.$transaction([
      prisma.quiz.count({ where }),
      prisma.quiz.findMany({
        where,
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      data: quizzes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error("[API] Error fetching quizzes:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des quiz" }, { status: 500 })
  }
}