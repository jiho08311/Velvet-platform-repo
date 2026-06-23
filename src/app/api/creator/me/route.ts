import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"

export async function GET() {
  try {
    const session = await requireSession()
    const creator = await getCreatorByUserId(session.userId)

    return NextResponse.json({
      creator: creator ?? null,
    })
  } catch {
    return NextResponse.json({ creator: null })
  }
}