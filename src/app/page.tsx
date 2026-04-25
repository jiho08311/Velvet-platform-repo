export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getPassVerificationRedirectPath } from "@/modules/auth/server/assert-pass-verified"
import {
  buildPathWithNext,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/modules/auth/lib/redirect-handoff"

type ProfileRow = {
  is_deactivated: boolean | null
  is_adult_verified: boolean | null
  username: string | null
}

export default async function HomePage() {
  const nextPath = "/feed"
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      buildPathWithNext({
        path: SIGN_IN_PATH,
        next: nextPath,
      })
    )
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_deactivated, is_adult_verified, username")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!profile) {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  if (profile.is_deactivated) {
    redirect("/reactivate-account")
  }

  if (!profile.is_adult_verified) {
    redirect(getPassVerificationRedirectPath({ next: nextPath }))
  }

  if (!profile.username) {
    redirect(
      buildPathWithNext({
        path: ONBOARDING_PATH,
        next: nextPath,
      })
    )
  }

  redirect("/feed")
}
