import { requireAdmin } from "./require-admin"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type GetUserDetailParams = {
  userId: string
}

export async function getUserDetail({ userId }: GetUserDetailParams) {
  await requireAdmin()

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) {
    throw error
  }

  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id, status, subscription_price_cents")
    .eq("user_id", userId)
    .maybeSingle()

  return {
    profile,
    creator: creator ?? null,
  }
}