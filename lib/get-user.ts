import { auth } from "@/lib/auth"
import { User } from "@/models"

export async function getCurrentUser() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  // Récupérer les informations complètes de l'utilisateur depuis la base de données
  const user = await User.findByPk(session.user.id, {
    attributes: ['id', 'name', 'email', 'role', 'image', 'createdAt', 'updatedAt']
  })

  // Sequelize models return instances, we might want plain objects for Next.js serialization sometimes, 
  // but here returning the model instance or result is fine if it matches the expected type.
  // Using .toJSON() ensures it's a plain object.
  return user ? user.toJSON() : null
}
