"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Home, RotateCcw, Trophy, Sparkles, Share2, BookOpen } from "lucide-react"
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"

interface QuestionResult {
  questionId: number
  questionText: string
  options: string[]
  userAnswer: number
  correctAnswer: number
  isCorrect: boolean
  explanation?: string
  reference?: string
}

interface AttemptResult {
  attemptId: number
  score: number
  totalQuestions: number
  completedAt: string
  quizTitle: string
  results: QuestionResult[]
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()

  useEffect(() => {
    // Force clean local storage on results page to prevent stale data
    // This is redundant but ensures safety if the submit cleanup failed
    if (params.id) {
      localStorage.removeItem(`quiz_progress_${params.id}`)
    }
  }, [params.id])

  useEffect(() => {
    setShareUrl(window.location.href)

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    async function fetchResults() {
      const attemptId = searchParams.get("attemptId")
      if (!attemptId) {
        setError("ID de tentative manquant")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/attempts/${attemptId}`)
        if (!response.ok) {
          throw new Error("Résultats non trouvés")
        }
        const data = await response.json()
        setResult(data)

        const percentage = Math.round((data.score / data.totalQuestions) * 100)
        if (percentage >= 80) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 10000) // Stop confetti after 10 seconds
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchResults()
    }
  }, [status, searchParams, router])

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="glass-card rounded-2xl p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="glass-card rounded-2xl p-6 max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Résultats non trouvés"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const percentage = Math.round((result.score / result.totalQuestions) * 100)
  const isPerfect = percentage === 100
  const isGood = percentage >= 70
  const isBad = percentage < 50

  const shareMessage = `J'ai obtenu ${result.score} sur ${result.totalQuestions} au quiz "${result.quizTitle}" sur BibleQuest !`

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 pb-20">
      {showConfetti && <Confetti width={width} height={height} />}
      <div className="container mx-auto px-4 pt-6 max-w-2xl">
        {/* Score Summary - Duolingo style */}
        <div className="glass-card rounded-3xl p-6 md:p-8 mb-6 shadow-xl text-center">
          <div className="mb-6">
            {isPerfect && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4 mx-auto">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
            )}
            {isGood && !isPerfect && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4 mx-auto">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {result.quizTitle}
            </h1>
            <p className="text-muted-foreground">Résultats de votre quiz</p>
          </div>

          <div className="mb-6">
            <div className={`text-6xl md:text-7xl font-bold mb-3 ${isPerfect ? "text-primary" : isGood ? "text-primary" : "text-destructive"
              }`}>
              {result.score}/{result.totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-foreground mb-2">
              {percentage}%
            </div>
            <Progress
              value={percentage}
              className={`h-4 mb-4 ${isPerfect ? "[&>div]:bg-primary" : isGood ? "[&>div]:bg-primary" : "[&>div]:bg-destructive"
                }`}
            />
            <p className="text-sm text-muted-foreground">
              {isPerfect
                ? "🎉 Parfait ! Excellent travail !"
                : isGood
                  ? "👍 Bon score ! Continuez comme ça !"
                  : "💪 Continuez à vous améliorer !"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1 glass border-border/50"
            >
              <Link href="/quizzes">
                <BookOpen className="h-4 w-4 mr-2" />
                Liste des Quiz
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="flex-1 glass border-border/50"
            >
              <Link href={`/quizzes/${params.id}`}>
                <Trophy className="h-4 w-4 mr-2" />
                Historique
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Link href={`/quiz/${params.id}`}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rejouer
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/20">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              Partager vos résultats
            </h3>
            <div className="flex justify-center gap-4">
              <TwitterShareButton url={shareUrl} title={shareMessage}>
                <TwitterIcon size={40} round />
              </TwitterShareButton>
              <FacebookShareButton url={shareUrl} title={shareMessage}>
                <FacebookIcon size={40} round />
              </FacebookShareButton>
              <WhatsappShareButton url={shareUrl} title={shareMessage}>
                <WhatsappIcon size={40} round />
              </WhatsappShareButton>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground px-2">Détails des réponses</h2>

          {result.results.map((question, index) => (
            <div
              key={question.questionId}
              className={`glass-card rounded-3xl p-5 md:p-6 border-l-4 ${question.isCorrect
                ? "border-l-primary bg-primary/5"
                : "border-l-destructive bg-destructive/5"
                }`}
            >
              <div className="flex items-start gap-3 mb-4">
                {question.isCorrect ? (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Question {index + 1}
                    </span>
                    {question.isCorrect ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        Correct
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">
                        Incorrect
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {question.questionText}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {(() => {
                  let options: string[] = [];
                  if (Array.isArray(question.options)) {
                    options = question.options;
                  } else if (typeof question.options === 'string') {
                    try {
                      options = JSON.parse(question.options);
                    } catch (e) {
                      options = [];
                    }
                  }

                  return options.map((option, optionIndex) => {
                    const isUserAnswer = optionIndex === question.userAnswer
                    const isCorrectAnswer = optionIndex === question.correctAnswer

                    return (
                      <div
                        key={optionIndex}
                        className={`p-4 rounded-2xl border-2 transition-all ${isCorrectAnswer
                          ? "border-primary bg-primary/10"
                          : isUserAnswer
                            ? "border-destructive bg-destructive/10"
                            : "border-border/50 bg-background/50"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {isCorrectAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                          )}
                          <span className={`text-sm flex-1 ${isCorrectAnswer || isUserAnswer ? "font-semibold" : ""
                            }`}>
                            {option}
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {question.explanation && (
                <div className="glass rounded-2xl p-4 mb-3">
                  <p className="text-sm font-semibold text-foreground mb-2">💡 Explication</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {question.explanation}
                  </p>
                </div>
              )}

              {question.reference && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  📖 {question.reference}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
