/**
 * Repository pour les opérations de base de données liées aux Quiz
 * Sépare la logique d'accès aux données de la logique métier
 */

import { Quiz, Question } from "@/models";
import { Op, Sequelize } from "sequelize";
import { QuizWithCount, QuizWithQuestions, QuestionForClient } from "@/shared/types";
import { QuizQueryDto } from "@/shared/dto";

export class QuizRepository {
  /**
   * Récupère tous les quiz avec pagination et filtres
   */
  async findAll(query: QuizQueryDto): Promise<{
    quizzes: QuizWithCount[];
    total: number;
  }> {
    const { page, limit, category, difficulty, search } = query;
    const offset = (page - 1) * limit;

    // Construction de la clause where
    const where: any = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Quiz.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: {
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("Questions.id")), "questionCount"]
        ]
      },
      include: [
        {
          model: Question,
          attributes: [],
          duplicating: false,
        }
      ],
      group: ['Quiz.id'],
      subQuery: false,
    });

    const total = Array.isArray(count) ? count.length : count;

    // Map to expected type (with _count)
    const quizzes = rows.map(q => {
      const quiz = q.toJSON() as any;
      return {
        ...quiz,
        _count: { questions: quiz.questionCount || 0 }
      } as QuizWithCount;
    });

    return { quizzes, total: total as number };
  }

  /**
   * Récupère un quiz par son ID
   */
  async findById(id: number): Promise<any | null> {
    const quiz = await Quiz.findByPk(id);
    return quiz ? quiz.toJSON() : null;
  }

  /**
   * Récupère un quiz avec ses questions (pour l'affichage client)
   */
  async findByIdWithQuestions(id: number, includeAnswers = false): Promise<any | null> {
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Question,
          attributes: includeAnswers
            ? ['id', 'questionText', 'options', 'correctOptionIndex', 'explanation', 'reference']
            : ['id', 'questionText', 'options', 'reference'],
        },
      ],
    });

    if (!quiz) return null;

    // Transform for client compatibility if needed (e.g. lowercase 'questions')
    // Sequelize returns 'Questions' by default unless aliased, but let's assume standard behavior first.
    // If the type expects 'questions', we rename it.
    const quizJson = quiz.toJSON() as any;
    quizJson.questions = quizJson.Questions || [];
    delete quizJson.Questions;

    // Ensure options are parsed as array
    if (quizJson.questions) {
      quizJson.questions = quizJson.questions.map((q: any) => {
        if (typeof q.options === 'string') {
          try {
            q.options = JSON.parse(q.options);
          } catch (e) {
            console.error(`Failed to parse options for question ${q.id}`, e);
            q.options = [];
          }
        }
        return q;
      });
    }

    return quizJson;
  }

  /**
   * Récupère un quiz avec toutes ses questions (pour la correction)
   */
  async findByIdWithAllQuestions(id: number): Promise<any | null> {
    const quiz = await Quiz.findByPk(id, {
      include: [Question],
    });

    if (!quiz) return null;

    const quizJson = quiz.toJSON() as any;
    quizJson.questions = quizJson.Questions || [];
    delete quizJson.Questions;

    // Ensure options are parsed as array
    if (quizJson.questions) {
      quizJson.questions = quizJson.questions.map((q: any) => {
        if (typeof q.options === 'string') {
          try {
            q.options = JSON.parse(q.options);
          } catch (e) {
            console.error(`Failed to parse options for question ${q.id}`, e);
            q.options = [];
          }
        }
        return q;
      });
    }

    return quizJson;
  }

  /**
   * Vérifie si un quiz existe
   */
  async exists(id: number): Promise<boolean> {
    const count = await Quiz.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Crée un nouveau quiz
   */
  async create(data: {
    title: string;
    description?: string | null;
    category?: string | null;
    difficulty?: string | null;
  }): Promise<any> {
    return Quiz.create(data);
  }

  /**
   * Met à jour un quiz
   */
  async update(id: number, data: {
    title?: string;
    description?: string | null;
    category?: string | null;
    difficulty?: string | null;
  }): Promise<any> {
    const quiz = await Quiz.findByPk(id);
    if (!quiz) throw new Error("Quiz not found");
    return quiz.update(data);
  }

  /**
   * Supprime un quiz
   */
  async delete(id: number): Promise<void> {
    const quiz = await Quiz.findByPk(id);
    if (quiz) {
      await quiz.destroy();
    }
  }

  /**
   * Récupère les questions d'un quiz
   */
  async getQuestions(quizId: number): Promise<QuestionForClient[]> {
    const questions = await Question.findAll({
      where: { quizId },
      attributes: ['id', 'questionText', 'options', 'reference'],
    });

    return questions.map(q => {
      const qJson = q.toJSON() as QuestionForClient;
      if (typeof qJson.options === 'string') {
        try {
          qJson.options = JSON.parse(qJson.options);
        } catch (e) {
          console.error(`Failed to parse options for question ${qJson.id}`, e);
          qJson.options = [];
        }
      }
      return qJson;
    });
  }
}

// Instance singleton
export const quizRepository = new QuizRepository();
