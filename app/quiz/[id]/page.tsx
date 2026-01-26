"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"

interface Question {
  id: number
  questionText: string
  options: string[]
  reference?: string
}

interface Quiz {
  id: number
  title: string
  description?: string
  questions: Question[]
}

// Map of Question ID -> Selected Option Index
type AnswersMap = Record<number, number>

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Changed from number[] to Record<number, number> for robustness
  const [answers, setAnswers] = useState<AnswersMap>({})

  const [submitting, setSubmitting] = useState(false)

  // Local Storage Key
  const storageKey = `quiz_progress_${params.id}`

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${params.id}`)
        if (!response.ok) {
          throw new Error("Quiz non trouvé")
        }
        const data = await response.json()
        setQuiz(data)

        // Restore from local storage if available
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            // Support both old format (just answers) and new format (answers + index)
            if (parsed.answers) {
              setAnswers(parsed.answers)
              if (typeof parsed.currentQuestionIndex === 'number') {
                setCurrentQuestionIndex(parsed.currentQuestionIndex)
              }
            } else {
              // Legacy format support
              setAnswers(parsed)
            }
          } catch (e) {
            console.error("Failed to parse saved progress", e)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement")
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [params.id, storageKey])

  const handleNext = () => {
    if (!quiz) return
    const currentQ = quiz.questions[currentQuestionIndex]
    // Check if current question is answered
    if (answers[currentQ.id] === undefined) return

    if (currentQuestionIndex < (quiz.questions.length || 0) - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      // Save progress including new index
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        currentQuestionIndex: nextIndex
      }))
    }
  }

  const handleAnswerSelect = (optionIndex: number) => {
    if (!quiz) return
    const currentQ = quiz.questions[currentQuestionIndex]

    const newAnswers = { ...answers, [currentQ.id]: optionIndex }
    setAnswers(newAnswers)

    // Save to local storage
    localStorage.setItem(storageKey, JSON.stringify({
      answers: newAnswers,
      currentQuestionIndex
    }))
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      // Save progress including new index
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        currentQuestionIndex: prevIndex
      }))
    }
  }

  const handleSubmit = async () => {
    if (!session) {
      // Save current state before redirecting
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        currentQuestionIndex
      }))
      const callbackUrl = encodeURIComponent(window.location.href)
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
      return
    }

    if (!quiz) return

    // Validate all questions answered
    const unansweredCount = quiz.questions.filter(q => answers[q.id] === undefined).length

    if (unansweredCount > 0) {
      setError(`Veuillez répondre à toutes les questions (${unansweredCount} restante${unansweredCount > 1 ? 's' : ''}).`)
      return
    }

    setSubmitting(true)

    try {
      // Transform map to array for API
      const formattedAnswers = Object.entries(answers).map(([qId, aIdx]) => ({
        questionId: Number(qId),
        answerIndex: aIdx
      }))

      const response = await fetch(`/api/quizzes/${params.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: formattedAnswers }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(errorData.error || "Erreur lors de la soumission")
      }

      const result = await response.json()

      // Clear local storage on success
      localStorage.removeItem(storageKey)

      router.push(`/quiz/${params.id}/results?attemptId=${result.attemptId}`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Erreur de soumission")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="glass-card rounded-2xl p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="glass-card rounded-2xl p-6 max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Quiz non trouvé"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const selectedOption = answers[currentQuestion.id]

  // Check if all questions have an answer in the map
  const allQuestionsAnswered = quiz.questions.every(q => answers[q.id] !== undefined)
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 pb-20 overflow-x-hidden">
      {/* Mobile-first header with glassmorphism */}
      <div className="sticky top-0 z-50 glass-strong border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground line-clamp-1">{quiz.title}</h1>
            <span className="text-sm font-semibold text-primary">
              {currentQuestionIndex + 1}/{quiz.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6 max-w-2xl">
        {/* Question Card - Duolingo style */}
        <div className="glass-card rounded-3xl p-6 mb-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 leading-tight">
              {currentQuestion.questionText}
            </h2>
            {currentQuestion.reference && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                📖 {currentQuestion.reference}
              </div>
            )}
          </div>

          {/* Options - Large touch targets for mobile */}
          <div className="space-y-3">

            {(() => {
              let options: string[] = [];
              if (Array.isArray(currentQuestion.options)) {
                options = currentQuestion.options;
              } else if (typeof currentQuestion.options === 'string') {
                try {
                  options = JSON.parse(currentQuestion.options);
                } catch (e) {
                  options = [];
                }
              }

              return options.map((option, index) => {
                const isSelected = selectedOption === index
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`
                      w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
                      active:scale-[0.98]
                      ${isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5"
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          transition-all duration-200
                          ${isSelected
                            ? "border-primary bg-primary scale-110"
                            : "border-muted-foreground/50"
                          }
                        `}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-base font-medium text-foreground flex-1">{option}</span>
                    </div>
                  </button>
                )
              })
            })()}

          </div>

          {/* Navigation - Mobile optimized */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="lg"
              disabled={currentQuestionIndex === 0}
              className="w-12 h-12 p-0 rounded-full glass border-border/50 flex-shrink-0"
              aria-label="Question précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            {/* Progress dots - scrollable on very small screens */}
            <div className="flex-1 flex justify-center overflow-hidden">
              <div className="flex gap-1.5 px-2 overflow-x-auto no-scrollbar py-2 max-w-full justify-start sm:justify-center">
                {quiz.questions.map((q, index) => (
                  <div
                    key={index}
                    className={`
                    h-2 rounded-full transition-all duration-300 flex-shrink-0
                    ${answers[q.id] !== undefined
                        ? "bg-primary w-6"
                        : index === currentQuestionIndex
                          ? "bg-primary/50 w-4"
                          : "bg-muted w-2"
                      }
                  `}
                  />
                ))}
              </div>
            </div>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || submitting || status !== "authenticated"}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 rounded-full px-6"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="font-bold">Finir</span>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={selectedOption === undefined}
                size="lg"
                className="w-12 h-12 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 flex-shrink-0"
                aria-label="Question suivante"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          {status !== "authenticated" && (
            <div className="glass-card rounded-2xl p-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vous devez être connecté pour soumettre vos réponses.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {error && (
            <div className="glass-card rounded-2xl p-4 mt-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}