import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

export async function isUsernameTaken(username: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const normalized = username.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", normalized)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}