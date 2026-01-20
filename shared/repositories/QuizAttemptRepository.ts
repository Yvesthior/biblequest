/**
 * Repository pour les opérations de base de données liées aux QuizAttempt
 */

import { prisma } from "@/lib/prisma";
import { QuizAttempt, QuizAttemptWithDetails, AttemptAnswer, AnswerSubmission } from "@/shared/types";

export class QuizAttemptRepository {
  /**
   * Crée une nouvelle tentative de quiz
   */
  async create(data: {
    userId: string;
    quizId: number;
    score: number;
    totalQuestions: number;
    answers: string; // JSON string
    details: Array<{
      questionId: number;
      selectedOption: number;
      isCorrect: boolean;
    }>;
  }): Promise<QuizAttempt> {
    return prisma.quizAttempt.create({
      data: {
        userId: data.userId,
        quizId: data.quizId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        answers: data.answers,
        details: {
          create: data.details,
        },
      },
    });
  }

  /**
   * Récupère une tentative par son ID
   */
  async findById(id: number): Promise<QuizAttemptWithDetails | null> {
    return prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: true,
        details: {
          include: {
            question: true,
          },
        },
      },
    });
  }

  /**
   * Récupère toutes les tentatives d'un utilisateur
   */
  async findByUserId(userId: string, limit = 10): Promise<QuizAttemptWithDetails[]> {
    return prisma.quizAttempt.findMany({
      where: { userId },
      take: limit,
      orderBy: {
        completedAt: "desc",
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          },
        },
      },
    });
  }

  /**
   * Récupère toutes les tentatives d'un quiz
   */
  async findByQuizId(quizId: number): Promise<QuizAttempt[]> {
    return prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: {
        completedAt: "desc",
      },
    });
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getUserStats(userId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
  }> {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      select: {
        score: true,
        totalQuestions: true,
      },
    });

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
      };
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => {
      const percentage = (attempt.score / attempt.totalQuestions) * 100;
      return sum + percentage;
    }, 0);
    const averageScore = Math.round((totalScore / totalAttempts) * 100) / 100;

    const bestScore = Math.max(
      ...attempts.map((attempt) => Math.round((attempt.score / attempt.totalQuestions) * 100))
    );

    return {
      totalAttempts,
      averageScore,
      bestScore,
    };
  }
}

// Instance singleton
export const quizAttemptRepository = new QuizAttemptRepository();
