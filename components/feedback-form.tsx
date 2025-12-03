'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

type QuizInfo = {
  id: number;
  title: string;
};

type QuestionInfo = {
  id: number;
  questionText: string;
};

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle2 } from "lucide-react"

export function FeedbackForm({ quizzes }: { quizzes: QuizInfo[] }) {
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [questions, setQuestions] = useState<QuestionInfo[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  
  const [isLoadingQuestions, startQuestionsTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();

  useEffect(() => {
    if (!selectedQuizId) {
      setQuestions([]);
      setSelectedQuestionIds(new Set());
      return;
    }

    startQuestionsTransition(async () => {
      try {
        const response = await fetch(`/api/quizzes/${selectedQuizId}/questions`);
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        const data: QuestionInfo[] = await response.json();
        setQuestions(data);
        setSelectedQuestionIds(new Set()); // Reset selection on new quiz
      } catch (error) {
        console.error(error);
        toast.error("Impossible de charger les questions pour ce quiz.");
        setQuestions([]);
      }
    });
  }, [selectedQuizId]);

  const handleQuestionToggle = (questionId: number) => {
    const newSelection = new Set(selectedQuestionIds);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedQuestionIds(newSelection);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedQuizId || selectedQuestionIds.size === 0 || message.trim().length < 10) {
      toast.warning("Veuillez sélectionner un quiz, au moins une question, et rédiger un message d'au moins 10 caractères.");
      return;
    }

    startSubmittingTransition(async () => {
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: Number(selectedQuizId),
            reportedQuestionIds: Array.from(selectedQuestionIds),
            message: message.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Submission failed');
        }

        // Show success modal
        setShowSuccessDialog(true)
        
        // Reset form
        setSelectedQuizId('');
        setQuestions([]);
        setSelectedQuestionIds(new Set());
        setMessage('');
      } catch (error) {
        console.error(error);
        toast.error("Une erreur est survenue lors de l'envoi de votre signalement.");
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Formulaire de Signalement</CardTitle>
            <CardDescription>Suivez les étapes ci-dessous pour nous envoyer votre rapport.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Select Quiz */}
            <div className="space-y-2">
              <Label htmlFor="quiz-select" className="text-lg font-semibold">Étape 1 : Choisissez le quiz</Label>
              <Select onValueChange={setSelectedQuizId} value={selectedQuizId}>
                <SelectTrigger id="quiz-select">
                  <SelectValue placeholder="Sélectionnez un quiz..." />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={String(quiz.id)}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Questions */}
            {isLoadingQuestions && (
              <div className="flex items-center justify-center p-6">
                <Spinner />
              </div>
            )}
            {selectedQuizId && !isLoadingQuestions && questions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Étape 2 : Cochez la ou les questions concernées</Label>
                <div className="space-y-3 rounded-md border p-4 max-h-60 overflow-y-auto">
                  {questions.map((question) => (
                    <div key={question.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`q-${question.id}`}
                        onCheckedChange={() => handleQuestionToggle(question.id)}
                        checked={selectedQuestionIds.has(question.id)}
                      />
                      <Label htmlFor={`q-${question.id}`} className="font-normal cursor-pointer">
                        {question.questionText}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Message */}
            {selectedQuestionIds.size > 0 && (
               <div className="space-y-2">
                  <Label htmlFor="message" className="text-lg font-semibold">Étape 3 : Décrivez le problème</Label>
                  <Textarea
                    id="message"
                    placeholder="Ex: La bonne réponse pour cette question est en fait..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
               </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || selectedQuestionIds.size === 0}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Envoyer le signalement
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center">Signalement envoyé !</DialogTitle>
            <DialogDescription className="text-center">
              Merci pour votre contribution. Votre signalement a bien été reçu et sera traité prochainement par notre équipe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => setShowSuccessDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
