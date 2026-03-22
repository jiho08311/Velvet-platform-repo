import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { listCreators } from "@/modules/admin/server/list-creators"

export async function GET() {
  try {
    await requireUser()

    const creators = await listCreators()

    return NextResponse.json(
      { creators },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load creators"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}