import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { quizService } from "@/shared/services/QuizService"
import { SubmitQuizDto } from "@/shared/dto"
import { withErrorHandler, requireAuth } from "@/shared/errors/errorHandler"

async function handler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const userId = requireAuth(session)

  const { id } = await params
  const quizId = quizService.validateQuizId(id)

  // Validation du body
  const body = await request.json()
  const { answers } = SubmitQuizDto.parse(body)

  // Soumission du quiz via le service
  const result = await quizService.submitQuiz(quizId, userId, answers)

  return NextResponse.json(result)
}

export const POST = withErrorHandler(handler)
