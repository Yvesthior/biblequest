import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Users, BarChart3, Settings, Edit, Trash2, Upload, MessageSquare } from "lucide-react"
import Link from "next/link"

async function getAdminStats() {
  const [totalQuizzes, totalUsers, totalAttempts, recentQuizzes] = await Promise.all([
    prisma.quiz.count(),
    prisma.user.count(),
    prisma.quizAttempt.count(),
    prisma.quiz.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    })
  ])

  return {
    totalQuizzes,
    totalUsers,
    totalAttempts,
    recentQuizzes
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Administration</h1>
          <p className="text-muted-foreground">
            Gérez les quiz, les utilisateurs et les statistiques de l'application.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Totaux</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
              <p className="text-xs text-muted-foreground">
                Quiz disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Comptes créés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tentatives</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                Quiz complétés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" className="w-full">
                <Link href="/admin/quizzes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Gestion des Quiz
              </CardTitle>
              <CardDescription>
                Créez, modifiez et supprimez des quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/admin/quizzes">
                  Voir tous les quiz
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/quizzes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un quiz
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/quizzes/bulk-upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Import en masse
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs et les rôles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/users">
                  Voir les utilisateurs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiques
              </CardTitle>
              <CardDescription>
                Consultez les statistiques détaillées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full mb-2">
                <Link href="/admin/stats">
                  Voir les statistiques
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/feedback">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Voir les signalements
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz Récents
            </CardTitle>
            <CardDescription>
              Les derniers quiz créés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentQuizzes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun quiz créé pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground">{quiz.description}</p>
                      <div className="flex items-center gap-2 mt-2">
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
                        <span className="text-xs text-muted-foreground">
                          {quiz._count.questions} questions • {quiz._count.attempts} tentatives
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
