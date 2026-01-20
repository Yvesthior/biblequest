import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { userService } from "@/shared/services/UserService"
import { UpdateProfileDto } from "@/shared/dto"
import { withErrorHandler, requireAuth } from "@/shared/errors/errorHandler"

async function handler(req: Request) {
  const session = await auth()
  const userId = requireAuth(session)

  const body = await req.json()
  const data = UpdateProfileDto.parse(body)

  // Mise à jour du profil via le service
  const updatedUser = await userService.updateProfile(userId, data)

  return NextResponse.json(updatedUser)
}

export const PATCH = withErrorHandler(handler)