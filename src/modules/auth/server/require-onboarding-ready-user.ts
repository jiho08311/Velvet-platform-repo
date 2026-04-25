import { redirect } from "next/navigation"

import {
  buildPathWithNext,
  ONBOARDING_PATH,
  resolveRedirectTarget,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { readOnboardingReadiness } from "@/modules/auth/server/read-onboarding-readiness"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"

type RequireOnboardingReadyUserParams = {
  signInNext: string
}

export async function requireOnboardingReadyUser({
  signInNext,
}: RequireOnboardingReadyUserParams): Promise<
  Awaited<ReturnType<typeof requireActiveUser>>
> {
  const resolvedNext = resolveRedirectTarget({
    target: signInNext,
  })
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: resolvedNext,
      })
    )
  }

  const readiness = await readOnboardingReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: resolvedNext,
      })
    )
  }

  return user
}
