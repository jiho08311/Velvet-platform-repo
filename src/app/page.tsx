export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

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
    .select("is_deactivated")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!profile) {
    redirect("/feed")
  }

  if (profile.is_deactivated) {
    redirect("/reactivate-account")
  }

  redirect("/feed")
}