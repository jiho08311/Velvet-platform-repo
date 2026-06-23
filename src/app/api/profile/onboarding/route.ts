// src/app/api/profile/onboarding/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { updateOnboardingProfile } from "@/modules/profile/public/update-onboarding-profile"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username } = await request.json()

    await updateOnboardingProfile({
      profileId: user.id,
      username,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete onboarding"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
