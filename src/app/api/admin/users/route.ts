import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { listUsers } from "@/modules/admin/server/list-users"

export async function GET() {
  try {
    await requireUser()

    const users = await listUsers()

    return NextResponse.json(
      { users },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load users"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}