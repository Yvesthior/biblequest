/**
 * Classe d'erreur personnalisée pour l'application
 * Permet de gérer les erreurs métier de manière structurée
 */

import { HTTP_STATUS, ERROR_MESSAGES } from "@/shared/constants";

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  
  // Not Found
  NOT_FOUND = "NOT_FOUND",
  QUIZ_NOT_FOUND = "QUIZ_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  QUESTION_NOT_FOUND = "QUESTION_NOT_FOUND",
  
  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_ID = "INVALID_ID",
  INVALID_INPUT = "INVALID_INPUT",
  
  // Business Logic
  QUIZ_ALREADY_SUBMITTED = "QUIZ_ALREADY_SUBMITTED",
  USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  
  // Server
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message || ERROR_MESSAGES.INTERNAL_ERROR);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.isOperational = true;
    this.details = details;

    // Maintient le stack trace pour le débogage
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods pour créer des erreurs communes
  static unauthorized(message?: string): AppError {
    return new AppError(
      ErrorCode.UNAUTHORIZED,
      message || ERROR_MESSAGES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  static forbidden(message?: string): AppError {
    return new AppError(
      ErrorCode.FORBIDDEN,
      message || ERROR_MESSAGES.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN
    );
  }

  static notFound(resource?: string): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      resource ? `${resource} non trouvé(e)` : ERROR_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  static validationError(message: string, details?: unknown): AppError {
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      message,
      HTTP_STATUS.BAD_REQUEST,
      details
    );
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(
      ErrorCode.INVALID_INPUT,
      message,
      HTTP_STATUS.BAD_REQUEST,
      details
    );
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(
      ErrorCode.USERNAME_ALREADY_EXISTS,
      message,
      HTTP_STATUS.CONFLICT,
      details
    );
  }

  static internal(message?: string, details?: unknown): AppError {
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      message || ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details
    );
  }

  // Convertir l'erreur en format JSON pour les réponses API
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}
