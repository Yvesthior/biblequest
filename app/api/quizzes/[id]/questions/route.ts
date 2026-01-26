import { NextResponse } from 'next/server';
import { Question } from '@/models';
import { auth } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const quizId = parseInt(params.id, 10);

  if (isNaN(quizId)) {
    return NextResponse.json({ error: 'ID de quiz invalide' }, { status: 400 });
  }

  try {
    const questions = await Question.findAll({
      where: {
        quizId: quizId,
      },
      attributes: ['id', 'questionText'],
      order: [['id', 'ASC']]
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error(`Erreur lors de la récupération des questions pour le quiz ${quizId}:`, error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
