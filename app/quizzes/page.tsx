import { prisma } from "@/lib/prisma"
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
  const skip = (page - 1) * limit

  const where: any = {}

  if (category && category !== "all") {
    where.category = category
  }

  if (difficulty && difficulty !== "all") {
    where.difficulty = difficulty
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const [total, quizzes] = await prisma.$transaction([
    prisma.quiz.count({ where }),
    prisma.quiz.findMany({
      where,
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { questions: true },
        },
        attempts: userId ? {
          where: { userId: userId },
          select: { id: true },
        } : false,
      },
    }),
  ])

  const quizzesWithCompletion = quizzes.map(quiz => ({
    ...quiz,
    isCompleted: quiz.attempts && quiz.attempts.length > 0,
  }))

  return {
    quizzes: quizzesWithCompletion,
    total
  }
}

async function getMetadata() {
  const categories = await prisma.quiz.findMany({
    select: { category: true },
    distinct: ['category'],
    where: { category: { not: null } }
  }).then(res => res.map(r => r.category).filter(Boolean) as string[])

  const difficulties = await prisma.quiz.findMany({
    select: { difficulty: true },
    distinct: ['difficulty'],
    where: { difficulty: { not: null } }
  }).then(res => res.map(r => r.difficulty).filter(Boolean) as string[])

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