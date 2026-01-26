import Link from "next/link"
import { Quiz, Question, QuizAttempt } from "@/models"
import { Op, Sequelize } from "sequelize"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowRight, Sparkles, Trophy, Zap } from "lucide-react"
import { getCurrentUser } from "@/lib/get-user"

async function getQuizzes(userId?: string) {
  const whereClause = userId ? {
    id: {
      [Op.notIn]: Sequelize.literal(`(
        SELECT quizId FROM quizattempt WHERE userId = '${userId}'
      )`)
    }
  } : {};

  const quizzes = await Quiz.findAll({
    where: whereClause,
    attributes: {
      include: [
        [Sequelize.fn("COUNT", Sequelize.col("Questions.id")), "questionCount"]
      ]
    },
    include: [{
      model: Question,
      attributes: [],
      duplicating: false,
    }],
    group: ['Quiz.id'],
    limit: 6,
    order: [['createdAt', 'DESC']],
    subQuery: false // Important for limit/offset with group by
  });

  // Map Sequelize results to match the structure expected by the UI (simulating Prisma's _count)
  return quizzes.map(q => {
    const quiz = q.toJSON() as any;
    return {
      ...quiz,
      _count: {
        questions: quiz.questionCount || 0
      }
    };
  });
}

export default async function HomePage() {
  const user = await getCurrentUser() // Get current user
  const quizzes = await getQuizzes(user?.id) // Pass userId to getQuizzes

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Hero Section - Mobile First */}
      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Apprendre en s'amusant</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Maîtrisez la Bible
            <br />
            <span className="text-primary">Quiz par Quiz</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Testez vos connaissances bibliques avec des quiz interactifs.
            Chaque question est accompagnée de références et d'explications détaillées.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Scores détaillés</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Apprentissage rapide</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Références bibliques</span>
            </div>
          </div>

          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
            <Link href="/quizzes" className="gap-2">
              Découvrir les quiz
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Quiz Grid - Mobile First */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Quiz populaires</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/quizzes" className="text-primary">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          {quizzes.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">Aucun quiz disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="glass-card rounded-3xl p-6 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {quiz.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {quiz.category && (
                      <Badge variant="secondary" className="text-xs">
                        {quiz.category}
                      </Badge>
                    )}
                    {quiz.difficulty && (
                      <Badge
                        variant={
                          quiz.difficulty === "Facile"
                            ? "default"
                            : quiz.difficulty === "Moyen"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {quiz.difficulty}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">
                      {quiz._count.questions} {quiz._count.questions > 1 ? "questions" : "question"}
                    </span>
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      Commencer
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {quizzes.length > 0 && (
            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg" className="glass">
                <Link href="/quizzes" className="gap-2">
                  Voir tous les quiz
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Features Section - Mobile First */}
        <div className="max-w-4xl mx-auto mt-16 mb-12">
          <div className="glass-card rounded-3xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Comment ça fonctionne ?
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">Choisissez un quiz</h4>
                <p className="text-sm text-muted-foreground">
                  Parcourez notre collection de quiz bibliques
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">Répondez aux questions</h4>
                <p className="text-sm text-muted-foreground">
                  Testez vos connaissances avec des questions interactives
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">Découvrez vos résultats</h4>
                <p className="text-sm text-muted-foreground">
                  Obtenez votre score et des explications détaillées
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
