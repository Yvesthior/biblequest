import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { Feedback, Quiz, User } from "@/models"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: Quiz,
          attributes: ['title']
        },
        {
          model: User,
          attributes: ['name', 'email']
        }
      ],
      order: [
        ['createdAt', 'DESC']
      ]
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("[ADMIN FEEDBACK] Error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
