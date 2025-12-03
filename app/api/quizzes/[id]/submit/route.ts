import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logError } from "@/lib/logger"

interface AnswerSubmission {
  questionId: number
  answerIndex: number
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params
    const quizId = Number.parseInt(id)
    const body = await request.json()
    
    const answers: AnswerSubmission[] = body.answers

    if (isNaN(quizId)) {
      return NextResponse.json({ error: "ID de quiz invalide" }, { status: 400 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz non trouvé" }, { status: 404 })
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Format de réponses invalide" }, { status: 400 })
    }

    let score = 0
    
    const results = quiz.questions.map((question) => {
      const submission = answers.find((a) => a.questionId === question.id)
      const userAnswer = submission ? submission.answerIndex : -1
      
      const isCorrect = userAnswer === question.correctOptionIndex
      if (isCorrect) score++

      return {
        questionId: question.id,
        userAnswer,
        isCorrect,
        // Extra data for frontend response, not for DB storage
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctOptionIndex,
        explanation: question.explanation,
        reference: question.reference,
      }
    })

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id as string,
        quizId,
        score,
        totalQuestions: quiz.questions.length,
        answers: JSON.stringify(answers),
        // Save detailed answers for analytics
        details: {
          create: results.map(r => ({
             questionId: r.questionId,
             selectedOption: r.userAnswer,
             isCorrect: r.isCorrect
          }))
        }
      },
    })

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalQuestions: quiz.questions.length,
      results,
    })
  } catch (error) {
    console.error("[API SUBMIT] Error:", error)
    await logError({ error, context: { route: request.url } })

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Erreur lors de la soumission du quiz",
      },
      { status: 500 }
    )
  }
}
