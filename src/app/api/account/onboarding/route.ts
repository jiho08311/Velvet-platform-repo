import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { executeProfileOnboardingCompletion } from "@/modules/identity/public/profile-onboarding-completion"

export async function POST(request: Request) {
  try {
    const session = await requireSession()

    const formData = await request.formData()
    const username = String(formData.get("username") ?? "")

    await executeProfileOnboardingCompletion({
      profileId: session.userId,
      username,
    })

    return NextResponse.redirect(
      new URL("/profile", request.url)
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "ONBOARDING_FAILED"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}