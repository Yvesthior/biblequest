/**
 * Service métier pour les Utilisateurs
 */

import { User } from "@/models";
import { AppError } from "@/shared/errors/AppError";
import { UpdateProfileDto, RegisterDto } from "@/shared/dto";
import { User as UserType, UserProfile } from "@/shared/types";
import bcrypt from "bcryptjs";
import { quizAttemptRepository } from "@/shared/repositories/QuizAttemptRepository";
import { randomUUID } from "node:crypto";

export class UserService {
  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id: string): Promise<UserType | null> {
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'username', 'email', 'role', 'image', 'createdAt', 'updatedAt']
    });
    return user ? user.toJSON() as UserType : null;
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
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserType> {
    // Vérifier si le username est déjà pris
    if (data.username) {
      const existingUser = await User.findOne({
        where: { username: data.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw AppError.conflict("Ce pseudo est déjà pris");
      }
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound("Utilisateur");
    }

    await user.update({
      name: data.name,
      username: data.username,
    });

    // Return updated user plain object
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role as UserType['role'],
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: RegisterDto): Promise<UserType> {
    // Vérifier si l'email existe déjà
    const existingEmail = await User.findOne({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw AppError.conflict("Cet email est déjà utilisé");
    }

    // Vérifier si le username existe déjà (si fourni)
    if (data.username) {
      const existingUsername = await User.findOne({
        where: { username: data.username },
      });

      if (existingUsername) {
        throw AppError.conflict("Ce pseudo est déjà pris");
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await User.create({
      id: randomUUID(),
      name: data.name,
      email: data.email,
      username: data.username,
      password: hashedPassword,
      image: null,
      role: 'USER'
    });

    return {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role as UserType['role'],
      image: newUser.image,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  }

  /**
   * Vérifie si un utilisateur existe
   */
  async userExists(id: string): Promise<boolean> {
    const count = await User.count({
      where: { id },
    });
    return count > 0;
  }
}

// Instance singleton
export const userService = new UserService();
