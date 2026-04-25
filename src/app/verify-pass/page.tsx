// src/app/verify-pass/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import {
  getPassVerificationRedirectPath,
  normalizePassVerificationNext,
} from "@/modules/auth/server/assert-pass-verified"
import { DEFAULT_AUTH_RESUME_PATH } from "@/modules/auth/lib/redirect-handoff"
import { VerifyPassPage } from "@/modules/auth/ui/VerifyPassPage"

type ProfileRow = {
  is_adult_verified: boolean | null
}

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInParams = new URLSearchParams({
      next: getPassVerificationRedirectPath({
        next: normalizedNext ?? undefined,
      }),
    })

    redirect(`/sign-in?${signInParams.toString()}`)
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_adult_verified")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (profile?.is_adult_verified) {
    redirect(normalizedNext ?? DEFAULT_AUTH_RESUME_PATH)
  }

  return <VerifyPassPage profileId={user.id} next={normalizedNext} />
}
