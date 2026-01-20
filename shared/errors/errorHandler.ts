/**
 * Gestionnaire d'erreurs centralisé
 * Gère toutes les erreurs de l'application de manière cohérente
 */

import { NextResponse } from "next/server";
import { AppError, ErrorCode } from "./AppError";
import { logError } from "@/lib/logger";
import { HTTP_STATUS } from "@/shared/constants";
import { ZodError } from "zod";

/**
 * Gère les erreurs et retourne une réponse NextResponse appropriée
 */
export async function handleApiError(
  error: unknown,
  context?: { route?: string; userId?: string }
): Promise<NextResponse> {
  // Erreur AppError (erreur métier)
  if (error instanceof AppError) {
    // Log uniquement les erreurs serveur
    if (error.statusCode >= 500) {
      await logError({ error, context });
    }

    return NextResponse.json(
      error.toJSON(),
      { status: error.statusCode }
    );
  }

  // Erreur de validation Zod
  if (error instanceof ZodError) {
    const validationError = AppError.validationError(
      "Erreur de validation",
      error.flatten()
    );
    return NextResponse.json(
      validationError.toJSON(),
      { status: validationError.statusCode }
    );
  }

  // Erreur Prisma
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: unknown };
    
    // Erreur de contrainte unique
    if (prismaError.code === "P2002") {
      const conflictError = AppError.conflict(
        "Une ressource avec ces informations existe déjà"
      );
      return NextResponse.json(
        conflictError.toJSON(),
        { status: conflictError.statusCode }
      );
    }

    // Ressource non trouvée
    if (prismaError.code === "P2025") {
      const notFoundError = AppError.notFound();
      return NextResponse.json(
        notFoundError.toJSON(),
        { status: notFoundError.statusCode }
      );
    }
  }

  // Erreur générique
  const appError = AppError.internal(
    error instanceof Error ? error.message : "Une erreur inattendue s'est produite"
  );

  // Log toutes les erreurs non gérées
  await logError({ error, context });

  return NextResponse.json(
    appError.toJSON(),
    { status: appError.statusCode }
  );
}

/**
 * Wrapper pour les handlers API qui gère automatiquement les erreurs
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as Request;
      return handleApiError(error, {
        route: request.url,
      });
    }
  };
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function requireAuth(session: { user?: { id?: string } } | null): string {
  if (!session?.user?.id) {
    throw AppError.unauthorized();
  }
  return session.user.id;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function requireAdmin(session: { user?: { id?: string; role?: string } } | null): string {
  const userId = requireAuth(session);
  
  if (session?.user?.role !== "ADMIN") {
    throw AppError.forbidden("Accès réservé aux administrateurs");
  }
  
  return userId;
}
