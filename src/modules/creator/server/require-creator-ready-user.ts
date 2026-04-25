import { redirect } from "next/navigation"

import {
  buildPathWithNext,
  resolveRedirectTarget,
} from "@/modules/auth/lib/redirect-handoff"
import { requireOnboardingReadyUser } from "@/modules/auth/server/require-onboarding-ready-user"
import { readCreatorReadiness } from "@/modules/creator/server/read-creator-readiness"

type OnboardingReadyUser = Awaited<
  ReturnType<typeof requireOnboardingReadyUser>
>

type ReadyCreator = Extract<
  Awaited<ReturnType<typeof readCreatorReadiness>>,
  { ok: true }
>["creator"]

type RequireCreatorReadyUserParams = {
  signInNext: string
  creatorRequiredRedirect?: string
}

export async function requireCreatorReadyUser({
  signInNext,
  creatorRequiredRedirect = "/become-creator",
}: RequireCreatorReadyUserParams): Promise<{
  user: OnboardingReadyUser
  creator: ReadyCreator
}> {
  const resolvedNext = resolveRedirectTarget({
    target: signInNext,
  })
  const user = await requireOnboardingReadyUser({
    signInNext: resolvedNext,
  })

  const creatorReadiness = await readCreatorReadiness({
    userId: user.id,
  })

  if (!creatorReadiness.ok) {
    redirect(
      buildPathWithNext({
        path: creatorRequiredRedirect,
        next: resolvedNext,
      })
    )
  }

  return {
    user,
    creator: creatorReadiness.creator,
  }
}
