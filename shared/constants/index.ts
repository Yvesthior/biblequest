/**
 * Constantes partagées de l'application
 * Centralise toutes les valeurs constantes pour éviter les "magic strings"
 */

// Rôles utilisateurs
export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Statuts de feedback
export const FEEDBACK_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
} as const;

export type FeedbackStatus = typeof FEEDBACK_STATUS[keyof typeof FEEDBACK_STATUS];

// Catégories de quiz
export const QUIZ_CATEGORIES = {
  ANCIEN_TESTAMENT: "Ancien Testament",
  NOUVEAU_TESTAMENT: "Nouveau Testament",
  GENERAL: "Général",
} as const;

export type QuizCategory = typeof QUIZ_CATEGORIES[keyof typeof QUIZ_CATEGORIES];

// Difficultés de quiz
export const QUIZ_DIFFICULTIES = {
  FACILE: "Facile",
  MOYEN: "Moyen",
  DIFFICILE: "Difficile",
} as const;

export type QuizDifficulty = typeof QUIZ_DIFFICULTIES[keyof typeof QUIZ_DIFFICULTIES];

// Pagination par défaut
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Non authentifié",
  FORBIDDEN: "Accès refusé",
  NOT_FOUND: "Ressource non trouvée",
  VALIDATION_ERROR: "Erreur de validation",
  INTERNAL_ERROR: "Erreur interne du serveur",
  INVALID_ID: "ID invalide",
  QUIZ_NOT_FOUND: "Quiz non trouvé",
  USER_NOT_FOUND: "Utilisateur non trouvé",
  QUESTION_NOT_FOUND: "Question non trouvée",
} as const;

// Codes HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
