import { NextResponse } from "next/server"
import { listUsers } from "@/modules/admin/server/list-users"

export async function GET() {
  try {
    const users = await listUsers()

    return NextResponse.json(
      {
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.displayName,
          is_deactivated: user.isDeactivated,
          is_banned: user.isBanned,
          created_at: user.createdAt,
        })),
      },
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
