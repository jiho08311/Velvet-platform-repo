import { NextResponse } from "next/server"
import { devAutoLoginByPassword } from "@/modules/auth/server/dev-auto-login"

type Body = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      )
    }

    const body = (await request.json()) as Body
    const email = body.email?.trim()
    const password = body.password?.trim()

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      )
    }

    const result = await devAutoLoginByPassword(email, password)

    return NextResponse.json(
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DEV_LOGIN_FAILED"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}