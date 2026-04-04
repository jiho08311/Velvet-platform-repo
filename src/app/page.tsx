export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  is_deactivated: boolean | null
  is_adult_verified: boolean | null
  username: string | null
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
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
    redirect("/verify-pass")
  }

  if (profile.is_deactivated) {
    redirect("/reactivate-account")
  }

  if (!profile.is_adult_verified) {
    redirect("/verify-pass")
  }

  if (!profile.username) {
    redirect("/onboarding")
  }

  redirect("/feed")
}