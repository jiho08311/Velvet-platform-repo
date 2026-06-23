import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { executeAccountReactivation } from "@/modules/identity/public/account-reactivation"

export async function POST(request: Request) {
  try {
    const session = await requireSession()

    await executeAccountReactivation({
      profileId: session.userId,
    })

    return NextResponse.redirect(
      new URL("/", request.url)
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "ACCOUNT_REACTIVATION_FAILED"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}