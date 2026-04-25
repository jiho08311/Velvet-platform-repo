import { redirect } from "next/navigation"

import {
  assertPassVerified,
  getPassVerificationRedirectPath,
} from "@/modules/auth/server/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  username: string | null
}

export async function requireNotificationPageAccess(nextPath: string) {
  let user: Awaited<ReturnType<typeof requireActiveUser>>

  try {
    user = await requireActiveUser()
  } catch {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      }),
    )
  }

  try {
    await assertPassVerified({ profileId: user.id })
  } catch {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (profileError) {
    throw profileError
  }

  if (!profile?.username) {
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: nextPath,
      }),
    )
  }

  return user
}
