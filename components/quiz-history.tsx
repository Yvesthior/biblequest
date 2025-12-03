"use client"

import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Question {
  id: number
  questionText: string
  options: string[] // The prisma schema says Json, but we expect string[]
  correctOptionIndex: number
  explanation?: string | null
}

interface Attempt {
  id: number
  score: number
  totalQuestions: number
  completedAt: Date
  answers: string // JSON string
}

interface QuizHistoryProps {
  attempts: Attempt[]
  questions: Question[]
}

export function QuizHistory({ attempts, questions }: QuizHistoryProps) {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined)

  if (attempts.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2">
        <Clock className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Votre Historique</h2>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" value={openItem} onValueChange={setOpenItem}>
        {attempts.map((attempt, index) => {
          const parsedAnswers = JSON.parse(attempt.answers)
          const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100)
          
          // Determine if it's the old format (number[]) or new format (AnswerSubmission[])
          const isLegacyFormat = Array.isArray(parsedAnswers) && typeof parsedAnswers[0] === 'number'

          return (
            <AccordionItem key={attempt.id} value={`item-${attempt.id}`} className="glass-card rounded-2xl px-4 border-none">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex flex-col items-start text-left gap-1">
                    <span className="font-semibold text-foreground">
                      Tentative du {format(new Date(attempt.completedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                    <Badge variant={percentage >= 70 ? "default" : percentage >= 40 ? "secondary" : "destructive"}>
                      Score: {percentage}%
                    </Badge>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      {attempt.score}/{attempt.totalQuestions}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Progress value={percentage} className="h-3 flex-1" />
                    <span className="font-bold text-lg">{percentage}%</span>
                  </div>

                  <div className="space-y-4">
                    {questions.map((question, qIndex) => {
                      let userAnswerIndex = -1
                      
                      if (isLegacyFormat) {
                         // Fallback for legacy data: use array index
                         userAnswerIndex = parsedAnswers[qIndex]
                      } else {
                         // Robust: use question ID
                         const submission = parsedAnswers.find((a: any) => a.questionId === question.id)
                         userAnswerIndex = submission ? submission.answerIndex : -1
                      }

                      const isCorrect = userAnswerIndex === question.correctOptionIndex
                      
                      // Ensure options is an array
                      const options = Array.isArray(question.options) 
                        ? question.options as string[] 
                        : JSON.parse(JSON.stringify(question.options)) as string[]

                      return (
                        <div key={question.id} className={`p-4 rounded-xl border ${isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                          <div className="flex items-start gap-3 mb-3">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-2">{question.questionText}</p>
                              <div className="grid gap-2">
                                {options.map((option, oIndex) => {
                                  const isSelected = userAnswerIndex === oIndex
                                  const isTheCorrectAnswer = question.correctOptionIndex === oIndex
                                  
                                  let className = "p-2 rounded-lg text-sm border border-transparent "
                                  if (isTheCorrectAnswer) {
                                    className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
                                  } else if (isSelected && !isCorrect) {
                                    className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800"
                                  } else {
                                    className += "bg-muted/50 text-muted-foreground"
                                  }

                                  return (
                                    <div key={oIndex} className={className}>
                                      <span className="font-semibold mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                                      {option}
                                      {isSelected && !isCorrect && " (Votre réponse)"}
                                      {isTheCorrectAnswer && " (Bonne réponse)"}
                                    </div>
                                  )
                                })}
                              </div>
                              {question.explanation && !isCorrect && (
                                <div className="mt-3 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                                  <span className="font-semibold">Explication : </span>
                                  {question.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}