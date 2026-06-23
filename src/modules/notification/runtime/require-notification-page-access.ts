import { redirect } from "next/navigation"

import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/public/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/utils/redirect-handoff"
import {
  requireActiveSession,
  type ActiveSessionContext,
} from "@/modules/auth/public/require-active-session"
import { readOnboardingReadinessRuntime } from "@/modules/identity/public/onboarding-readiness"

export async function requireNotificationPageAccess(
  nextPath: string
): Promise<ActiveSessionContext> {
  let session: ActiveSessionContext

  try {
    session = await requireActiveSession()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  try {
    await assertPassVerified({ profileId: session.userId })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  const onboarding = await readOnboardingReadinessRuntime({
    userId: session.userId,
  })

  if (!onboarding.ok) {
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: nextPath,
      })
    )
  }

  return session
}