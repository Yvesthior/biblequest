/**
 * Service métier pour les Analytics et Statistiques
 */

import { prisma } from "@/lib/prisma";
import { quizAttemptRepository } from "@/shared/repositories/QuizAttemptRepository";
import { LeaderboardEntry } from "@/shared/types";

export class AnalyticsService {
  /**
   * Récupère les statistiques globales de l'application
   */
  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalQuizzes: number;
    totalAttempts: number;
    totalQuestions: number;
  }> {
    const [totalUsers, totalQuizzes, totalAttempts, totalQuestions] = await Promise.all([
      prisma.user.count(),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
      prisma.question.count(),
    ]);

    return {
      totalUsers,
      totalQuizzes,
      totalAttempts,
      totalQuestions,
    };
  }

  /**
   * Récupère le leaderboard (classement des utilisateurs)
   */
  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    // Récupérer tous les utilisateurs avec leurs tentatives
    const users = await prisma.user.findMany({
      where: {
        quizAttempts: {
          some: {},
        },
      },
      include: {
        quizAttempts: {
          select: {
            score: true,
            totalQuestions: true,
          },
        },
      },
    });

    // Calculer les statistiques pour chaque utilisateur
    const leaderboard: LeaderboardEntry[] = users
      .map((user) => {
        const attempts = user.quizAttempts;
        const totalAttempts = attempts.length;

        if (totalAttempts === 0) {
          return null;
        }

        // Calculer la moyenne des scores en pourcentage
        const totalScore = attempts.reduce((sum, attempt) => {
          const percentage = (attempt.score / attempt.totalQuestions) * 100;
          return sum + percentage;
        }, 0);
        const averageScore = Math.round((totalScore / totalAttempts) * 100) / 100;

        // Trouver le meilleur score
        const bestScore = Math.max(
          ...attempts.map((attempt) =>
            Math.round((attempt.score / attempt.totalQuestions) * 100)
          )
        );

        return {
          userId: user.id,
          username: user.username,
          name: user.name,
          totalAttempts,
          averageScore,
          bestScore,
        };
      })
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .sort((a, b) => {
        // Trier par meilleur score, puis par moyenne
        if (b.bestScore !== a.bestScore) {
          return b.bestScore - a.bestScore;
        }
        return b.averageScore - a.averageScore;
      })
      .slice(0, limit);

    return leaderboard;
  }

  /**
   * Récupère les statistiques d'un quiz spécifique
   */
  async getQuizStats(quizId: number): Promise<{
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
  }> {
    const attempts = await quizAttemptRepository.findByQuizId(quizId);

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
      };
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => {
      const percentage = (attempt.score / attempt.totalQuestions) * 100;
      return sum + percentage;
    }, 0);
    const averageScore = Math.round((totalScore / totalAttempts) * 100) / 100;

    // Taux de complétion (tous les quiz sont complétés si soumis)
    const completionRate = 100;

    return {
      totalAttempts,
      averageScore,
      completionRate,
    };
  }
}

// Instance singleton
export const analyticsService = new AnalyticsService();
