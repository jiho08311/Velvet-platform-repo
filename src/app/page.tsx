export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import { getPassVerificationRedirectPath } from "@/modules/auth/public/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/utils/redirect-handoff"
import { readAccountLifecycleState } from "@/modules/identity/public/account-lifecycle"
import { readAdultVerificationStatus } from "@/modules/identity/public/adult-verification-status"
import { readOnboardingReadinessRuntime } from "@/modules/identity/public/onboarding-readiness"

export default async function HomePage() {
  const nextPath = "/feed"
  const user = await getCurrentUser()

  if (!user) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      }),
    )
  }

  const [lifecycle, adultVerification, onboarding] = await Promise.all([
    readAccountLifecycleState({ profileId: user.id }),
    readAdultVerificationStatus({ profileId: user.id }),
    readOnboardingReadinessRuntime({ userId: user.id }),
  ])

  if (lifecycle.state === "profile_not_found") {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  if (
    lifecycle.state === "deactivated" ||
    lifecycle.state === "delete_pending"
  ) {
    redirect("/reactivate-account")
  }

  if (lifecycle.state === "deleted") {
    redirect("/account-unavailable")
  }

  if (!adultVerification.isAdultVerified) {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  if (!onboarding.ok) {
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: nextPath,
      }),
    )
  }

  redirect("/feed")
}
