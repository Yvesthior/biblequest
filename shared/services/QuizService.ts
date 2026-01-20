/**
 * Service métier pour les Quiz
 * Contient la logique métier liée aux quiz
 */

import { QuizRepository, quizRepository } from "@/shared/repositories/QuizRepository";
import { QuizAttemptRepository, quizAttemptRepository } from "@/shared/repositories/QuizAttemptRepository";
import { AppError } from "@/shared/errors/AppError";
import { QuizQueryDto, SubmitQuizDto, IdParamDto } from "@/shared/dto";
import { Quiz, QuizWithCount, QuizResult, PaginatedResponse } from "@/shared/types";
import { PAGINATION } from "@/shared/constants";

export class QuizService {
  private quizRepository: QuizRepository;
  private quizAttemptRepository: QuizAttemptRepository;

  constructor(
    quizRepo: QuizRepository,
    quizAttemptRepo: QuizAttemptRepository
  ) {
    this.quizRepository = quizRepo;
    this.quizAttemptRepository = quizAttemptRepo;
  }

  /**
   * Récupère tous les quiz avec pagination et filtres
   */
  async getQuizzes(query: QuizQueryDto): Promise<PaginatedResponse<QuizWithCount>> {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = query;

    const { quizzes, total } = await this.quizRepository.findAll({
      ...query,
      page,
      limit,
    });

    return {
      data: quizzes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère un quiz par son ID (sans les réponses)
   */
  async getQuizById(id: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findById(id);

    if (!quiz) {
      throw AppError.notFound("Quiz");
    }

    return quiz;
  }

  /**
   * Récupère un quiz avec ses questions pour le client (sans les réponses)
   */
  async getQuizWithQuestions(id: number): Promise<Quiz> {
    const quiz = await this.quizRepository.findByIdWithQuestions(id, false);

    if (!quiz) {
      throw AppError.notFound("Quiz");
    }

    return quiz;
  }

  /**
   * Soumet un quiz et calcule le score
   */
  async submitQuiz(
    quizId: number,
    userId: string,
    answers: SubmitQuizDto["answers"]
  ): Promise<{
    attemptId: number;
    score: number;
    totalQuestions: number;
    results: QuizResult[];
  }> {
    // Vérifier que le quiz existe et récupérer les questions
    const quiz = await this.quizRepository.findByIdWithAllQuestions(quizId);

    if (!quiz) {
      throw AppError.notFound("Quiz");
    }

    // Valider que toutes les questions ont une réponse
    if (answers.length !== quiz.questions.length) {
      throw AppError.validationError(
        `Le nombre de réponses (${answers.length}) ne correspond pas au nombre de questions (${quiz.questions.length})`
      );
    }

    // Optimisation: Hash Map pour accès O(1)
    const answersMap = new Map<number, number>();
    for (const answer of answers) {
      answersMap.set(answer.questionId, answer.answerIndex);
    }

    // Calculer le score et préparer les résultats
    let score = 0;
    const results: QuizResult[] = [];

    for (const question of quiz.questions) {
      const userAnswer = answersMap.get(question.id) ?? -1;

      // Valider que la réponse est dans les limites
      if (userAnswer < 0 || userAnswer >= (question.options as string[]).length) {
        throw AppError.validationError(
          `Réponse invalide pour la question ${question.id}`
        );
      }

      const isCorrect = userAnswer === question.correctOptionIndex;
      if (isCorrect) {
        score++;
      }

      results.push({
        questionId: question.id,
        userAnswer,
        isCorrect,
        questionText: question.questionText,
        options: question.options as string[],
        correctAnswer: question.correctOptionIndex,
        explanation: question.explanation,
        reference: question.reference,
      });
    }

    // Créer la tentative en base de données
    const attempt = await this.quizAttemptRepository.create({
      userId,
      quizId,
      score,
      totalQuestions: quiz.questions.length,
      answers: JSON.stringify(answers),
      details: results.map((r) => ({
        questionId: r.questionId,
        selectedOption: r.userAnswer,
        isCorrect: r.isCorrect,
      })),
    });

    return {
      attemptId: attempt.id,
      score,
      totalQuestions: quiz.questions.length,
      results,
    };
  }

  /**
   * Valide un ID de quiz
   */
  validateQuizId(id: unknown): number {
    const parsed = IdParamDto.safeParse({ id });

    if (!parsed.success) {
      throw AppError.badRequest("ID de quiz invalide");
    }

    return parsed.data.id;
  }
}

// Instance singleton
export const quizService = new QuizService(quizRepository, quizAttemptRepository);
