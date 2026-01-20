/**
 * Service métier pour les Utilisateurs
 */

import { prisma } from "@/lib/prisma";
import { AppError } from "@/shared/errors/AppError";
import { UpdateProfileDto, RegisterDto } from "@/shared/dto";
import { User, UserProfile } from "@/shared/types";
import bcrypt from "bcryptjs";
import { quizAttemptRepository } from "@/shared/repositories/QuizAttemptRepository";

export class UserService {
  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Récupère le profil complet d'un utilisateur avec statistiques
   */
  async getUserProfile(id: string): Promise<UserProfile> {
    const user = await this.getUserById(id);
    
    if (!user) {
      throw AppError.notFound("Utilisateur");
    }

    const stats = await quizAttemptRepository.getUserStats(id);

    return {
      ...user,
      quizAttemptsCount: stats.totalAttempts,
      averageScore: stats.averageScore,
    };
  }

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
    // Vérifier si le username est déjà pris
    if (data.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw AppError.conflict("Ce pseudo est déjà pris");
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        username: data.username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: RegisterDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw AppError.conflict("Cet email est déjà utilisé");
    }

    // Vérifier si le username existe déjà (si fourni)
    if (data.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUsername) {
        throw AppError.conflict("Ce pseudo est déjà pris");
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Vérifie si un utilisateur existe
   */
  async userExists(id: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { id },
    });
    return count > 0;
  }
}

// Instance singleton
export const userService = new UserService();
