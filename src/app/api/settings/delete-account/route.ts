// src/app/api/settings/delete-account/route.ts
import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { executeAccountDeletionSchedule } from "@/modules/identity/public/account-deletion-schedule"

export async function POST(request: Request) {
  try {
    const session = await requireSession()

    await executeAccountDeletionSchedule({
      profileId: session.userId,
    })

    return NextResponse.redirect(new URL("/reactivate-account", request.url))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ACCOUNT_DELETE_FAILED"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}