import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"

export async function HEAD() {
  try {
    await requireUser()

    return new Response(null, { status: 200 })
  } catch {
    return new Response(null, { status: 401 })
  }
}

export async function GET() {
  try {
    const user = await requireUser()

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: {
          id: user.id,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      {
        isAuthenticated: false,
      },
      { status: 401 },
    )
  }
}