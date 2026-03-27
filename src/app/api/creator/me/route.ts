import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"

export async function GET() {
  try {
    const user = await requireUser()
    const creator = await getCreatorByUserId(user.id)

    return NextResponse.json({
      creator: creator ?? null,
    })
  } catch {
    return NextResponse.json({ creator: null })
  }
}