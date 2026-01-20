/**
 * Repository pour les opérations de base de données liées aux Quiz
 * Sépare la logique d'accès aux données de la logique métier
 */

import { prisma } from "@/lib/prisma";
import { Quiz, QuizWithCount, QuizWithQuestions, QuestionForClient } from "@/shared/types";
import { QuizQueryDto } from "@/shared/dto";
import { AppError } from "@/shared/errors/AppError";

export class QuizRepository {
  /**
   * Récupère tous les quiz avec pagination et filtres
   */
  async findAll(query: QuizQueryDto): Promise<{
    quizzes: QuizWithCount[];
    total: number;
  }> {
    const { page, limit, category, difficulty, search } = query;
    const skip = (page - 1) * limit;

    // Construction de la clause where
    const where: {
      category?: string;
      difficulty?: string;
      OR?: Array<{ title?: { contains: string }; description?: { contains: string } }>;
    } = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Transaction pour récupérer le total et les données en parallèle
    const [total, quizzes] = await prisma.$transaction([
      prisma.quiz.count({ where }),
      prisma.quiz.findMany({
        where,
        take: limit,
        skip,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      }),
    ]);

    return { quizzes, total };
  }

  /**
   * Récupère un quiz par son ID
   */
  async findById(id: number): Promise<Quiz | null> {
    return prisma.quiz.findUnique({
      where: { id },
    });
  }

  /**
   * Récupère un quiz avec ses questions (pour l'affichage client)
   */
  async findByIdWithQuestions(id: number, includeAnswers = false): Promise<QuizWithQuestions | null> {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          select: includeAnswers
            ? {
                id: true,
                questionText: true,
                options: true,
                correctOptionIndex: true,
                explanation: true,
                reference: true,
              }
            : {
                id: true,
                questionText: true,
                options: true,
                reference: true,
                // correctOptionIndex et explanation exclus pour le client
              },
        },
      },
    });

    return quiz;
  }

  /**
   * Récupère un quiz avec toutes ses questions (pour la correction)
   */
  async findByIdWithAllQuestions(id: number): Promise<QuizWithQuestions | null> {
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });
  }

  /**
   * Vérifie si un quiz existe
   */
  async exists(id: number): Promise<boolean> {
    const count = await prisma.quiz.count({
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
  }): Promise<Quiz> {
    return prisma.quiz.create({
      data,
    });
  }

  /**
   * Met à jour un quiz
   */
  async update(id: number, data: {
    title?: string;
    description?: string | null;
    category?: string | null;
    difficulty?: string | null;
  }): Promise<Quiz> {
    return prisma.quiz.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un quiz
   */
  async delete(id: number): Promise<void> {
    await prisma.quiz.delete({
      where: { id },
    });
  }

  /**
   * Récupère les questions d'un quiz
   */
  async getQuestions(quizId: number): Promise<QuestionForClient[]> {
    const questions = await prisma.question.findMany({
      where: { quizId },
      select: {
        id: true,
        questionText: true,
        options: true,
        reference: true,
      },
    });

    return questions;
  }
}

// Instance singleton
export const quizRepository = new QuizRepository();
