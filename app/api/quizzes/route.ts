import { NextResponse } from "next/server"
import { quizService } from "@/shared/services/QuizService"
import { QuizQueryDto } from "@/shared/dto"
import { withErrorHandler } from "@/shared/errors/errorHandler"

async function handler(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Validation et parsing des paramètres de requête
  const query = QuizQueryDto.parse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
    category: searchParams.get("category"),
    difficulty: searchParams.get("difficulty"),
    search: searchParams.get("search"),
  })

  // Utilisation du service métier
  const result = await quizService.getQuizzes(query)

  return NextResponse.json(result)
}

export const GET = withErrorHandler(handler)