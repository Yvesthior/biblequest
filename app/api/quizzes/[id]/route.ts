import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const quizId = Number.parseInt(id)

    if (isNaN(quizId)) {
      return NextResponse.json({ error: "ID de quiz invalide" }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            options: true,
            reference: true,
            // Don't send correctOptionIndex or explanation to client
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("[v0] Error fetching quiz:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération du quiz" }, { status: 500 })
  }
}
