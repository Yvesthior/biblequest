import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const feedbackSchema = z.object({
  quizId: z.number().int().positive(),
  reportedQuestionIds: z.array(z.number().int().positive()).min(1, "Au moins une question doit être sélectionnée."),
  message: z.string().min(10, "Votre message doit contenir au moins 10 caractères."),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = feedbackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Validation échouée", details: validation.error.flatten() }, { status: 400 });
    }

    const { quizId, reportedQuestionIds, message } = validation.data;

    // Vérifier que le quiz existe
    const quizExists = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quizExists) {
      return NextResponse.json({ error: "Le quiz spécifié n'existe pas." }, { status: 404 });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        quizId,
        message,
        userId: session.user.id,
        reportedQuestionIdsJson: JSON.stringify(reportedQuestionIds),
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du signalement:", error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
