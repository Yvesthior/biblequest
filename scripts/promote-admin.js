const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function promoteFirstUserToAdmin() {
  try {
    // Trouver le premier utilisateur
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    })

    if (!firstUser) {
      console.log('Aucun utilisateur trouvé dans la base de données.')
      return
    }

    // Promouvoir en admin
    const updatedUser = await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: 'ADMIN' }
    })

    console.log(`✅ Utilisateur promu administrateur:`)
    console.log(`   - Nom: ${updatedUser.name}`)
    console.log(`   - Email: ${updatedUser.email}`)
    console.log(`   - Rôle: ${updatedUser.role}`)
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

promoteFirstUserToAdmin()
