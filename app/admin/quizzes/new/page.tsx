"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, X, Save, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  questionText: string
  options: string[]
  correctOptionIndex: number
  explanation: string
  reference: string
}

export default function NewQuizPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: ""
  })
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      questionText: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      explanation: "",
      reference: ""
    }
  ])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: (questions.length + 1).toString(),
      questionText: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      explanation: "",
      reference: ""
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (questionId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== questionId))
    }
  }

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
          }
        : q
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error("Le titre du quiz est requis")
      }
      if (!formData.category) {
        throw new Error("La catégorie est requise")
      }
      if (!formData.difficulty) {
        throw new Error("La difficulté est requise")
      }

      // Validation des questions
      for (const question of questions) {
        if (!question.questionText.trim()) {
          throw new Error("Toutes les questions doivent avoir un texte")
        }
        if (question.options.some(opt => !opt.trim())) {
          throw new Error("Toutes les options doivent être remplies")
        }
        if (!question.explanation.trim()) {
          throw new Error("Toutes les questions doivent avoir une explication")
        }
      }

      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          questions: questions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation,
            reference: q.reference
          }))
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du quiz")
      }

      router.push("/admin/quizzes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création du quiz")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/quizzes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Nouveau Quiz</h1>
              <p className="text-muted-foreground">
                Créez un nouveau quiz avec ses questions et réponses.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Informations du Quiz
              </CardTitle>
              <CardDescription>
                Définissez les informations de base du quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du quiz *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Les Paraboles de Jésus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ancien Testament">Ancien Testament</SelectItem>
                      <SelectItem value="Nouveau Testament">Nouveau Testament</SelectItem>
                      <SelectItem value="Général">Général</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez le contenu de ce quiz..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulté *</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facile">Facile</SelectItem>
                    <SelectItem value="Moyen">Moyen</SelectItem>
                    <SelectItem value="Difficile">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                  <CardDescription>
                    Ajoutez les questions de votre quiz
                  </CardDescription>
                </div>
                <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, index) => (
                <Card key={question.id} className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Texte de la question *</Label>
                      <Textarea
                        value={question.questionText}
                        onChange={(e) => updateQuestion(question.id, "questionText", e.target.value)}
                        placeholder="Quelle est la question ?"
                        rows={2}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Options de réponse *</Label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctOptionIndex === optionIndex}
                              onChange={() => updateQuestion(question.id, "correctOptionIndex", optionIndex)}
                              className="w-4 h-4"
                            />
                            <Input
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Explication *</Label>
                      <Textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                        placeholder="Expliquez pourquoi cette réponse est correcte..."
                        rows={2}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Référence biblique</Label>
                      <Input
                        value={question.reference}
                        onChange={(e) => updateQuestion(question.id, "reference", e.target.value)}
                        placeholder="Ex: Matthieu 13:31-32"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Button asChild variant="outline">
              <Link href="/admin/quizzes">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer le quiz
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
