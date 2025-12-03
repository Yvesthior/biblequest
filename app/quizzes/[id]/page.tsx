import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Trophy, ArrowLeft, PlayCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { QuizHistory } from "@/components/quiz-history"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuizDetailsPage({ params }: PageProps) {
  const { id } = await params
  const quizId = parseInt(id)

  if (isNaN(quizId)) {
    notFound()
  }

  const user = await getCurrentUser()
  
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      _count: {
        select: { questions: true },
      },
    },
  })

  if (!quiz) {
    notFound()
  }

  // Fetch attempts if user is logged in
  let attempts: any[] = []
  if (user) {
    attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: quizId,
        userId: user.id,
      },
      orderBy: {
        completedAt: "desc",
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6 pl-0 hover:pl-2 transition-all">
          <Link href="/quizzes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux quiz
          </Link>
        </Button>

        {/* Quiz Header Card */}
        <div className="glass-card rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BookOpen className="h-32 w-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-wrap gap-3 mb-4">
              {quiz.category && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
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
                  className="text-sm px-3 py-1"
                >
                  {quiz.difficulty}
                </Badge>
              )}
              <Badge variant="outline" className="text-sm px-3 py-1">
                {quiz._count.questions} questions
              </Badge>
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              {quiz.title}
            </h1>
            
            {quiz.description && (
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                {quiz.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8 h-14 shadow-lg shadow-primary/25 rounded-xl">
                <Link href={`/quiz/${quiz.id}`}>
                  <PlayCircle className="h-6 w-6 mr-2" />
                  {attempts.length > 0 ? "Refaire le Quiz" : "Commencer le Quiz"}
                </Link>
              </Button>
              
              {attempts.length > 0 && (
                 <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-background/50 border border-border/50">
                   <Trophy className="h-5 w-5 text-yellow-500" />
                   <span className="font-medium">
                     Meilleur score : {Math.max(...attempts.map(a => a.score))}/{quiz._count.questions}
                   </span>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        {user && attempts.length > 0 && (
          <QuizHistory 
            attempts={attempts} 
            questions={quiz.questions.map(q => ({
              ...q,
              options: q.options as string[], // Type assertion for Prisma JSON
            }))} 
          />
        )}
        
        {/* Login Prompt */}
        {!user && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-muted-foreground mb-4">Connectez-vous pour sauvegarder votre progression et voir votre historique.</p>
            <Button asChild variant="outline">
              <Link href="/auth/signin">Se connecter</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
