import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Trophy, Target, Calendar, TrendingUp, Award, Star, UserPlus } from "lucide-react"
import { ProfileForm } from "@/components/profile-form"

async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      quizAttempts: {
        include: {
          quiz: true,
        },
        orderBy: {
          completedAt: "desc",
        },
      },
    },
  })

  if (!user) return null

  const attempts = user.quizAttempts
  const totalAttempts = attempts.length
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0)
  const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.score, 0)
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const perfectScores = attempts.filter(a => a.score === a.totalQuestions).length

  const uniqueQuizzes = new Set(attempts.map(attempt => attempt.quizId)).size

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentAttemptsCount = attempts.filter(attempt => 
    new Date(attempt.completedAt) >= sevenDaysAgo
  ).length

  const bestScore = attempts.length > 0 ? Math.max(...attempts.map(attempt => 
    Math.round((attempt.score / attempt.totalQuestions) * 100)
  )) : 0

  return {
    user,
    stats: {
      totalAttempts,
      totalQuestions,
      totalCorrect,
      averageScore,
      uniqueQuizzes,
      recentAttempts: recentAttemptsCount,
      bestScore,
      perfectScores,
    },
    recentAttempts: attempts.slice(0, 5),
  }
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const data = await getUserStats(user.id)

  if (!data) {
    redirect("/auth/signin")
  }

  const { user: userData, stats, recentAttempts } = data

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Mon Profil</h1>
          <p className="text-muted-foreground">
            Bienvenue, {userData.name || userData.email} !
          </p>
        </div>

        {/* Profile Editing Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Modifier le profil
            </CardTitle>
            <CardDescription>
              Mettez à jour les informations de votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialData={{ id: userData.id, name: userData.name, email: userData.email }} />
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Complétés</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.uniqueQuizzes} quiz uniques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalCorrect} bonnes réponses sur {stats.totalQuestions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meilleur Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bestScore}%</div>
              <p className="text-xs text-muted-foreground">
                Record personnel
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scores Parfaits</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.perfectScores}</div>
              <p className="text-xs text-muted-foreground">
                Victoires sans faute
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Progression Générale
              </CardTitle>
              <CardDescription>
                Votre niveau de maîtrise actuel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Niveau Actuel</span>
                  <span className="font-medium">
                    {stats.averageScore >= 90 ? "Expert" : 
                     stats.averageScore >= 75 ? "Avancé" : 
                     stats.averageScore >= 60 ? "Intermédiaire" : "Débutant"}
                  </span>
                </div>
                <Progress value={stats.averageScore} className="h-2" />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {stats.averageScore >= 90 && (
                  <Badge variant="default" className="gap-1">
                    <Award className="h-3 w-3" />
                    Expert
                  </Badge>
                )}
                {stats.totalAttempts >= 10 && (
                  <Badge variant="secondary" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    Assidu
                  </Badge>
                )}
                {stats.bestScore === 100 && (
                  <Badge variant="outline" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    Parfait
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activité Récente
              </CardTitle>
              <CardDescription>
                Vos 5 dernières tentatives de quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttempts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucune tentative récente.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => {
                    const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
                    return (
                      <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{attempt.quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.completedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{scorePercentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            {attempt.score}/{attempt.totalQuestions}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Succès
            </CardTitle>
            <CardDescription>
              Débloquez des badges en améliorant vos compétences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className={`p-4 rounded-lg border-2 ${stats.totalAttempts >= 1 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.totalAttempts >= 1 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Premier Pas</p>
                    <p className="text-sm text-muted-foreground">Terminez votre premier quiz.</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.totalAttempts >= 5 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.totalAttempts >= 5 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Déterminé</p>
                    <p className="text-sm text-muted-foreground">Terminez 5 quiz.</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.bestScore >= 90 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.bestScore >= 90 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Excellent</p>
                    <p className="text-sm text-muted-foreground">Obtenez un score de 90% ou plus.</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.uniqueQuizzes >= 3 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.uniqueQuizzes >= 3 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Explorateur</p>
                    <p className="text-sm text-muted-foreground">Terminez 3 quiz uniques.</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.bestScore === 100 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.bestScore === 100 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Score Parfait</p>
                    <p className="text-sm text-muted-foreground">Obtenez un score de 100%.</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${stats.recentAttempts >= 3 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stats.recentAttempts >= 3 ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Régulier</p>
                    <p className="text-sm text-muted-foreground">Terminez 3 quiz en 7 jours.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}