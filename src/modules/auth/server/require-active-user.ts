import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { requireUser } from "./require-user"

export async function requireActiveUser(): Promise<User> {
  const user = await requireUser()

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("is_banned, is_deactivated")
    .eq("id", user.id)
    .single()

  if (error) {
    throw error
  }

  if (profile?.is_banned) {
    redirect("/banned")
  }

  if (profile?.is_deactivated) {
    redirect("/reactivate-account")
  }

  return user
}