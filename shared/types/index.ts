/**
 * Types partagés de l'application
 * Définit les types TypeScript réutilisables dans toute l'application
 */

import { UserRole, FeedbackStatus, QuizCategory, QuizDifficulty } from "@/shared/constants";

// Types de base
export type ID = string | number;

// User types
export interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  quizAttemptsCount?: number;
  averageScore?: number;
}

// Quiz types
export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  category: QuizCategory | null;
  difficulty: QuizDifficulty | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizWithCount extends Quiz {
  _count?: {
    questions: number;
  };
}

export interface QuizWithQuestions extends Quiz {
  questions: Question[];
}

// Question types
export interface Question {
  id: number;
  quizId: number;
  questionText: string;
  options: string[]; // JSON array
  correctOptionIndex: number;
  explanation: string | null;
  reference: string | null;
}

export interface QuestionForClient {
  id: number;
  questionText: string;
  options: string[];
  reference: string | null;
  // correctOptionIndex et explanation exclus pour le client
}

// Quiz Attempt types
export interface QuizAttempt {
  id: number;
  userId: string;
  quizId: number;
  score: number;
  totalQuestions: number;
  answers: string; // JSON string
  completedAt: Date;
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz?: Quiz;
  details?: AttemptAnswer[];
}

export interface AttemptAnswer {
  id: number;
  attemptId: number;
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  createdAt: Date;
}

// Answer Submission types
export interface AnswerSubmission {
  questionId: number;
  answerIndex: number;
}

export interface QuizResult {
  questionId: number;
  userAnswer: number;
  isCorrect: boolean;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  reference: string | null;
}

// Feedback types
export interface Feedback {
  id: string;
  userId: string;
  quizId: number;
  message: string;
  status: FeedbackStatus;
  reportedQuestionIdsJson: string; // JSON array
  createdAt: Date;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Filter types
export interface QuizFilters {
  category?: QuizCategory | "all";
  difficulty?: QuizDifficulty | "all";
  search?: string;
}

export interface QuizQueryParams extends PaginationParams, QuizFilters {}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  name: string | null;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
}
