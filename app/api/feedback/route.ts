import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { CreateFeedbackDto } from '@/shared/dto';
import { AppError } from '@/shared/errors/AppError';
import { quizRepository } from '@/shared/repositories/QuizRepository';
import { withErrorHandler, requireAuth } from '@/shared/errors/errorHandler';

async function handler(request: Request) {
  const session = await auth();
  const userId = requireAuth(session);

  const body = await request.json();
  const { quizId, reportedQuestionIds, message } = CreateFeedbackDto.parse(body);

  // Vérifier que le quiz existe
  const quizExists = await quizRepository.exists(quizId);
  if (!quizExists) {
    throw AppError.notFound("Quiz");
  }

  // Créer le feedback
  const newFeedback = await prisma.feedback.create({
    data: {
      quizId,
      message,
      userId,
      reportedQuestionIdsJson: JSON.stringify(reportedQuestionIds),
    },
  });

  return NextResponse.json(newFeedback, { status: 201 });
}

export const POST = withErrorHandler(handler)
