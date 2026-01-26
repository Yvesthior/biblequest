import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { QuizAttempt, Quiz, Question } from "@/models"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params
    const attemptId = Number.parseInt(id)

    if (isNaN(attemptId)) {
      return NextResponse.json({ error: "ID de tentative invalide" }, { status: 400 })
    }

    const attemptInstance = await QuizAttempt.findByPk(attemptId, {
      include: [
        {
          model: Quiz,
          as: 'quiz',
          include: [
            {
              model: Question,
            },
          ],
        },
      ],
    })

    if (!attemptInstance) {
      return NextResponse.json({ error: "Tentative non trouvée" }, { status: 404 })
    }

    const attempt = attemptInstance.toJSON() as any;

    // Verify ownership
    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const storedAnswers = JSON.parse(attempt.answers)

    // Determine if it's the old format (number[]) or new format (AnswerSubmission[])
    const isLegacyFormat = Array.isArray(storedAnswers) && typeof storedAnswers[0] === 'number'

    const quizQuestions = attempt.quiz?.Questions || [];

    const results = quizQuestions.map((question: any, index: number) => {
      let userAnswer = -1

      if (isLegacyFormat) {
        // Fallback: rely on index (Risky but necessary for old data)
        userAnswer = storedAnswers[index]
      } else {
        // Robust: find by ID
        const submission = storedAnswers.find((a: any) => a.questionId === question.id)
        userAnswer = submission ? submission.answerIndex : -1
      }

      const isCorrect = userAnswer === question.correctOptionIndex

      return {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,
        userAnswer,
        correctAnswer: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
        reference: question.reference,
      }
    })

    return NextResponse.json({
      attemptId: attempt.id,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      completedAt: attempt.completedAt,
      quizTitle: attempt.quiz?.title,
      results,
    })
  } catch (error) {
    console.error("[v0] Error fetching attempt:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de la tentative" }, { status: 500 })
  }
}