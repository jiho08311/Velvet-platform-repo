import { redirect } from "next/navigation"
import { getCurrentUser } from "@/modules/auth/public/get-current-user"
import {
  getPassVerificationRedirectPath,
  normalizePassVerificationNext,
} from "@/modules/auth/public/assert-pass-verified"
import { DEFAULT_AUTH_RESUME_PATH } from "@/modules/auth/utils/redirect-handoff"
import { VerifyPassPage } from "@/modules/auth/public/auth-ui"
import { readAdultVerificationStatus } from "@/modules/identity/public/adult-verification-status"

type VerifyPassRouteProps = {
  searchParams: Promise<{
    next?: string
  }>
}

export default async function VerifyPassRoute({
  searchParams,
}: VerifyPassRouteProps) {
  const { next } = await searchParams
  const normalizedNext = next ? normalizePassVerificationNext(next) : null
  const user = await getCurrentUser()

  if (!user) {
    const signInParams = new URLSearchParams({
      next: getPassVerificationRedirectPath({
        next: normalizedNext ?? undefined,
      }),
    })

    redirect(`/sign-in?${signInParams.toString()}`)
  }

  const adultVerification = await readAdultVerificationStatus({
    profileId: user.id,
  })

  if (adultVerification.isAdultVerified) {
    redirect(normalizedNext ?? DEFAULT_AUTH_RESUME_PATH)
  }

  return <VerifyPassPage profileId={user.id} next={normalizedNext} />
}
