
import { FeedbackForm } from '@/components/feedback-form';
import { getCurrentUser } from '@/lib/get-user';
import { redirect } from 'next/navigation';

import { Quiz } from "@/models"

async function getQuizzes() {
  const quizzes = await Quiz.findAll({
    attributes: ['id', 'title'],
    order: [['title', 'ASC']]
  });

  // Serialize for client component
  return quizzes.map(q => ({
    id: q.id,
    title: q.title
  }));
}

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin?callbackUrl=/feedback');
  }

  const quizzes = await getQuizzes();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Signaler une Erreur</h1>
        <p className="text-muted-foreground">
          Un problème sur un quiz ? Une question mal formulée ou une réponse incorrecte ? Aidez-nous à améliorer la plateforme.
        </p>
      </div>
      <FeedbackForm quizzes={quizzes} />
    </div>
  );
}
