"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen } from "lucide-react"
import { QuizFilters } from "@/components/quiz-filters"

interface Quiz {
  id: number
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  _count: {
    questions: number
  }
}

interface QuizListProps {
  quizzes: Quiz[]
}

export function QuizList({ quizzes }: QuizListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  // Extraire les catégories et difficultés uniques
  const categories = [...new Set(quizzes.map(quiz => quiz.category).filter(Boolean))]
  const difficulties = [...new Set(quizzes.map(quiz => quiz.difficulty).filter(Boolean))]

  // Filtrer les quiz
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz => {
      const categoryMatch = !selectedCategory || quiz.category === selectedCategory
      const difficultyMatch = !selectedDifficulty || quiz.difficulty === selectedDifficulty
      return categoryMatch && difficultyMatch
    })
  }, [quizzes, selectedCategory, selectedDifficulty])

  return (
    <>
      <QuizFilters
        categories={categories}
        difficulties={difficulties}
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setSelectedDifficulty}
      />

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {quizzes.length === 0 
                ? "Aucun quiz disponible pour le moment."
                : "Aucun quiz ne correspond à vos filtres."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
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
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {quiz._count.questions} {quiz._count.questions > 1 ? "questions" : "question"}
                  </span>
                  <Button asChild>
                    <Link href={`/quiz/${quiz.id}`} className="gap-2">
                      Commencer
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
