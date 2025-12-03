"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Feedback {
  id: string
  createdAt: string
  message: string
  status: string
  quiz: {
    title: string
  }
  user: {
    name: string | null
    email: string
  }
  reportedQuestionIdsJson: any
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedbacks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/feedback")
      if (!response.ok) throw new Error("Impossible de charger les signalements")
      const data = await response.json()
      setFeedbacks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Signalements</h1>
          <p className="text-muted-foreground">Gérez les retours et signalements des utilisateurs.</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchFeedbacks}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Liste des signalements
          </CardTitle>
          <CardDescription>
            {feedbacks.length} signalement(s) reçu(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun signalement pour le moment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="w-[40%]">Message</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(feedback.createdAt), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {feedback.quiz.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{feedback.user.name || "Anonyme"}</span>
                        <span className="text-xs text-muted-foreground">{feedback.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-3" title={feedback.message}>
                        {feedback.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Questions ID: {Array.isArray(feedback.reportedQuestionIdsJson) 
                          ? feedback.reportedQuestionIdsJson.join(", ") 
                          : String(feedback.reportedQuestionIdsJson)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={feedback.status === "OPEN" ? "destructive" : "secondary"}>
                        {feedback.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
