import { redirect } from "next/navigation"

import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/public/assert-pass-verified"
import { readSession } from "@/modules/auth/public/read-session"
import { requireActiveSession } from "@/modules/auth/public/require-active-session"

export async function readVerifiedFeedSession(nextPath: string) {
  const session = await readSession()

  if (!session) {
    return null
  }

  try {
    await requireActiveSession()
  } catch {
    redirect("/reactivate-account")
  }

  try {
    await assertPassVerified({ profileId: session.userId })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  return session
}
