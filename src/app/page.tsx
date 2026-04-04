export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileRow = {
  is_deactivated: boolean | null
  username: string | null
  display_name: string | null
  birth_date: string | null
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
    .select("is_deactivated, username, display_name, birth_date")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!profile) {
    redirect("/onboarding")
  }

  if (profile.is_deactivated) {
    redirect("/reactivate-account")
  }

  if (!profile.username || !profile.display_name || !profile.birth_date) {
    redirect("/onboarding")
  }

  redirect("/feed")
}