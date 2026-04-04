// src/app/verify-pass/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { VerifyPassPage } from "@/modules/auth/ui/VerifyPassPage"

type ProfileRow = {
  is_adult_verified: boolean | null
}

export default async function VerifyPassRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
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
    redirect("/")
  }

  return <VerifyPassPage profileId={user.id} />
}