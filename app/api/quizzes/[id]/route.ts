import { NextResponse } from "next/server"
import { quizService } from "@/shared/services/QuizService"
import { withErrorHandler } from "@/shared/errors/errorHandler"

async function handler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Validation de l'ID
  const quizId = quizService.validateQuizId(id)

  // Récupération du quiz avec ses questions (sans les réponses)
  const quiz = await quizService.getQuizWithQuestions(quizId)

  return NextResponse.json(quiz)
}

export const GET = withErrorHandler(handler)
