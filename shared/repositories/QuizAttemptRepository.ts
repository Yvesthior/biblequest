/**
 * Repository pour les opérations de base de données liées aux QuizAttempt
 */

import { QuizAttempt, AttemptAnswer, Quiz, Question } from "@/models";
import { QuizAttemptWithDetails } from "@/shared/types";

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
  }): Promise<any> {

    // Sequelize allows nested creation if 'AttemptAnswers' is associated.
    // However, since we might not have set up the alias 'details', we can create the attempt first, then the details.
    // Or pass 'AttemptAnswers' as the key if that is the default alias.
    // Let's do it safely with standard creation.

    const attempt = await QuizAttempt.create({
      userId: data.userId,
      quizId: data.quizId,
      score: data.score,
      totalQuestions: data.totalQuestions,
      answers: data.answers
    });

    if (data.details && data.details.length > 0) {
      const detailsData = data.details.map(d => ({
        ...d,
        attemptId: attempt.id
      }));
      await AttemptAnswer.bulkCreate(detailsData);
    }

    // Return reloaded attempt or just the instance
    return attempt;
  }

  /**
   * Récupère une tentative par son ID
   */
  async findById(id: number): Promise<any | null> {
    const attempt = await QuizAttempt.findByPk(id, {
      include: [
        { model: Quiz },
        {
          model: AttemptAnswer,
          include: [{ model: Question }]
        }
      ],
    });

    if (!attempt) return null;

    // Map to structure expected by app (details = AttemptAnswers)
    const json = attempt.toJSON() as any;
    json.details = json.AttemptAnswers || [];
    if (json.details && json.details.length > 0) {
      // Map nested question if needed, Sequelize creates 'Question' property
      json.details = json.details.map((d: any) => ({
        ...d,
        question: d.Question
      }));
    }

    return json;
  }

  /**
   * Récupère toutes les tentatives d'un utilisateur
   */
  async findByUserId(userId: string, limit = 10): Promise<any[]> {
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      limit: limit,
      order: [['completedAt', 'DESC']],
      include: [
        {
          model: Quiz,
          attributes: ['id', 'title', 'category', 'difficulty']
        }
      ]
    });

    // Map 'Quiz' to 'quiz' (lowercase) if necessary, usually toJSON preserves casing of model name unless aliased.
    // Check if the frontend expects 'quiz'. 
    // Sequelize model name is 'Quiz', so property is 'Quiz'.
    // Typically we want lowercase for compat.
    return attempts.map(a => {
      const json = a.toJSON() as any;
      json.quiz = json.Quiz;
      return json;
    });
  }

  /**
   * Récupère toutes les tentatives d'un quiz
   */
  async findByQuizId(quizId: number): Promise<any[]> {
    const attempts = await QuizAttempt.findAll({
      where: { quizId },
      order: [['completedAt', 'DESC']],
    });
    return attempts; // Returns instances, safe to return or map toJSON
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getUserStats(userId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
  }> {
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      attributes: ['score', 'totalQuestions'],
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
