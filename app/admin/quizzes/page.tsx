import { getCurrentUser } from "@/lib/get-user"
import { Quiz } from "@/models"
import { Sequelize } from "sequelize"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"

async function getQuizzes() {
  const quizzes = await Quiz.findAll({
    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM question AS questions
            WHERE questions.quizId = Quiz.id
          )`),
          'questionsCount'
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM quizattempt AS attempts
            WHERE attempts.quizId = Quiz.id
          )`),
          'attemptsCount'
        ]
      ]
    },
    order: [['createdAt', 'DESC']]
  })

  // Transform to match expected structure
  return quizzes.map(q => {
    const json = q.toJSON();
    return {
      ...json,
      _count: {
        questions: (q.get('questionsCount') as number) || 0,
        attempts: (q.get('attemptsCount') as number) || 0
      }
    }
  })
}

export const metadata = {
  title: "Gestion des Quiz - Administration",
  description: "Gérez tous les quiz de l'application",
}

export default async function AdminQuizzesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  if (user.role !== "ADMIN") {
    redirect("/")
  }

  const quizzes = await getQuizzes()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Gestion des Quiz</h1>
              <p className="text-muted-foreground">
                Créez, modifiez et gérez tous les quiz de l'application.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/quizzes/new">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Quiz
              </Link>
            </Button>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="space-y-6">
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun quiz créé</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par créer votre premier quiz.
                </p>
                <Button asChild>
                  <Link href="/admin/quizzes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="font-serif text-xl">{quiz.title}</CardTitle>
                        <CardDescription className="text-base mt-1">{quiz.description}</CardDescription>
                      </div>
                      <div className="flex flex-col gap-1">
                        {quiz.category && (
                          <Badge variant="secondary" className="text-xs">
                            {quiz.category}
                          </Badge>
                        )}
                        {quiz.difficulty && (
                          <Badge
                            variant={quiz.difficulty === "Facile" ? "default" :
                              quiz.difficulty === "Moyen" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {quiz.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{quiz._count.questions} questions</span>
                      <span>{quiz._count.attempts} tentatives</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/quiz/${quiz.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
