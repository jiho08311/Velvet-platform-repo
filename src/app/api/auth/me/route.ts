import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"

export async function HEAD() {
  try {
  await requireSession()

    return new Response(null, { status: 200 })
  } catch {
    return new Response(null, { status: 401 })
  }
}

export async function GET() {
  try {
    const session = await requireSession()

    return NextResponse.json(
      {
        isAuthenticated: true,
        user: {
          id: session.userId,
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