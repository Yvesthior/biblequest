/**
 * Data Transfer Objects (DTOs)
 * Définit les structures de données pour les requêtes et réponses API
 */

import { z } from "zod";
import { QUIZ_CATEGORIES, QUIZ_DIFFICULTIES, PAGINATION } from "@/shared/constants";

// Quiz DTOs
export const CreateQuizDto = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Le titre est trop long"),
  description: z.string().max(1000, "La description est trop longue").optional(),
  category: z.enum([
    QUIZ_CATEGORIES.ANCIEN_TESTAMENT,
    QUIZ_CATEGORIES.NOUVEAU_TESTAMENT,
    QUIZ_CATEGORIES.GENERAL,
  ]).optional(),
  difficulty: z.enum([
    QUIZ_DIFFICULTIES.FACILE,
    QUIZ_DIFFICULTIES.MOYEN,
    QUIZ_DIFFICULTIES.DIFFICILE,
  ]).optional(),
});

export type CreateQuizDto = z.infer<typeof CreateQuizDto>;

export const UpdateQuizDto = CreateQuizDto.partial();

export type UpdateQuizDto = z.infer<typeof UpdateQuizDto>;

export const QuizQueryDto = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  search: z.string().optional(),
});

export type QuizQueryDto = z.infer<typeof QuizQueryDto>;

// Question DTOs
export const CreateQuestionDto = z.object({
  quizId: z.number().int().positive(),
  questionText: z.string().min(10, "La question doit contenir au moins 10 caractères"),
  options: z.array(z.string().min(1, "Chaque option doit contenir au moins 1 caractère")).min(2, "Au moins 2 options sont requises").max(6, "Maximum 6 options"),
  correctOptionIndex: z.number().int().nonnegative(),
  explanation: z.string().max(1000, "L'explication est trop longue").optional(),
  reference: z.string().max(200, "La référence est trop longue").optional(),
});

export type CreateQuestionDto = z.infer<typeof CreateQuestionDto>;

// Quiz Submission DTOs
export const SubmitQuizDto = z.object({
  answers: z.array(
    z.object({
      questionId: z.number().int().positive(),
      answerIndex: z.number().int().nonnegative(),
    })
  ).min(1, "Au moins une réponse est requise"),
});

export type SubmitQuizDto = z.infer<typeof SubmitQuizDto>;

// User DTOs
export const UpdateProfileDto = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50, "Le nom ne doit pas dépasser 50 caractères").optional(),
  username: z.string().min(3, "Le pseudo doit contenir au moins 3 caractères").max(30, "Le pseudo ne doit pas dépasser 30 caractères").optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDto>;

export const RegisterDto = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  username: z.string().min(3, "Le pseudo doit contenir au moins 3 caractères").max(30).optional(),
});

export type RegisterDto = z.infer<typeof RegisterDto>;

// Feedback DTOs
export const CreateFeedbackDto = z.object({
  quizId: z.number().int().positive(),
  reportedQuestionIds: z.array(z.number().int().positive()).min(1, "Au moins une question doit être sélectionnée"),
  message: z.string().min(10, "Votre message doit contenir au moins 10 caractères").max(1000, "Le message est trop long"),
});

export type CreateFeedbackDto = z.infer<typeof CreateFeedbackDto>;

export const UpdateFeedbackStatusDto = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export type UpdateFeedbackStatusDto = z.infer<typeof UpdateFeedbackStatusDto>;

// Params DTOs
export const IdParamDto = z.object({
  id: z.coerce.number().int().positive("ID invalide"),
});

export type IdParamDto = z.infer<typeof IdParamDto>;
