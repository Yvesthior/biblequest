import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { User } from "@/models"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    // Mettre à jour l'utilisateur
    const [updatedRows] = await User.update(
      { role: "ADMIN" },
      { where: { email } }
    )

    if (updatedRows === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const updatedUser = await User.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'role']
    })

    return NextResponse.json({
      message: "Utilisateur promu administrateur avec succès",
      user: updatedUser
    })
  } catch (error) {
    console.error("Erreur lors de la promotion de l'utilisateur:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
