import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import * as z from "zod"

const profileUpdateSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }).max(50, {
    message: "Le nom ne doit pas dépasser 50 caractères.",
  }).optional(),
  username: z.string().min(3, {
    message: "Le pseudo doit contenir au moins 3 caractères.",
  }).max(30, {
    message: "Le pseudo ne doit pas dépasser 30 caractères.",
  }).optional(),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const body = await req.json()
    const { name, username } = profileUpdateSchema.parse(body)

    // Check if username is taken
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return new NextResponse(JSON.stringify({ message: "Ce pseudo est déjà pris." }), { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name,
        username: username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ message: error.errors[0].message }), { status: 400 })
    }
    console.error("[PROFILE_UPDATE_ERROR]", error)
    return new NextResponse(JSON.stringify({ message: "Erreur interne du serveur" }), { status: 500 })
  }
}