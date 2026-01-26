import { Quiz, Question, QuizAttempt } from "@/models"
import { Op, Sequelize } from "sequelize"
import { QuizListWithFilters } from "@/components/quiz-list-with-filters"
import { getCurrentUser } from "@/lib/get-user"

interface PageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    category?: string
    difficulty?: string
    search?: string
  }>
}

async function getQuizzes(params: { page: number, limit: number, category?: string, difficulty?: string, search?: string }, userId?: string) {
  const { page, limit, category, difficulty, search } = params
  const offset = (page - 1) * limit

  const where: any = {}

  if (category && category !== "all") {
    where.category = category
  }

  if (difficulty && difficulty !== "all") {
    where.difficulty = difficulty
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ]
  }

  const { count, rows } = await Quiz.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    attributes: {
      include: [
        [Sequelize.fn("COUNT", Sequelize.col("Questions.id")), "questionCount"]
      ],
    },
    include: [
      {
        model: Question,
        attributes: [],
        duplicating: false,
      },
      // Note: Including 'attempts' conditionally is tricky in Sequelize findAndCountAll with grouping.
      // We often fetch attempts separately or use a subquery if we just need existence.
      // Here we map it afterwards if possible, or include it. 
      // Since `findAndCountAll` with grouping behaves differently, let's keep it simple:
      // We will separate the concern: fetch quizzes, then check for attempts if userId is present.
    ],
    group: ['Quiz.id'],
    subQuery: false,
  });

  // Calculate distinct total - findAndCountAll with group returns an array of counts
  // We need a separate count query or interpret the result
  const total = Array.isArray(count) ? count.length : count; // In recent Sequelize versions, with group, count is array of objects

  // Now for each quiz, check if the user completed it.
  // We can do this with a separate query to QuizAttempt
  const quizIds = rows.map(q => q.id);
  const userAttempts = userId ? await QuizAttempt.findAll({
    where: {
      quizId: { [Op.in]: quizIds },
      userId: userId
    },
    attributes: ['quizId']
  }) : [];

  const attemptMap = new Set(userAttempts.map(a => a.quizId));

  const quizzesWithCompletion = rows.map(q => {
    const quiz = q.toJSON() as any;
    return {
      ...quiz,
      isCompleted: attemptMap.has(quiz.id),
      _count: {
        questions: quiz.questionCount || 0
      }
    };
  });

  return {
    quizzes: quizzesWithCompletion,
    total: total as number // Fix type assertion if needed
  }
}

async function getMetadata() {
  const categories = await Quiz.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('category')), 'category']],
    where: { category: { [Op.ne]: null } }
  }).then(res => res.map(r => r.get('category')).filter(Boolean) as string[])

  const difficulties = await Quiz.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('difficulty')), 'difficulty']],
    where: { difficulty: { [Op.ne]: null } }
  }).then(res => res.map(r => r.get('difficulty')).filter(Boolean) as string[])

  return { categories, difficulties }
}

export const metadata = {
  title: "Tous les Quiz - BibleQuest",
  description: "Découvrez tous les quiz bibliques disponibles avec filtres et recherche",
}

export default async function QuizzesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  const resolvedSearchParams = await searchParams

  const page = Number(resolvedSearchParams.page) || 1
  const limit = Number(resolvedSearchParams.limit) || 12
  const category = resolvedSearchParams.category
  const difficulty = resolvedSearchParams.difficulty
  const search = resolvedSearchParams.search

  const { quizzes, total } = await getQuizzes({ page, limit, category, difficulty, search }, user?.id)
  const { categories, difficulties } = await getMetadata()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile-first header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Tous les Quiz
            </h1>
            <p className="text-muted-foreground">
              Explorez notre collection complète de quiz bibliques
            </p>
          </div>

          {/* Quiz List with Filters */}
          <QuizListWithFilters
            quizzes={quizzes}
            categories={categories}
            difficulties={difficulties}
            meta={{
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            }}
          />
        </div>
      </div>
    </div>
  )
}