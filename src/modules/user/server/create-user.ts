import type { User } from "../types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreateUserInput = {
  id: string
  email: string
  username: string
}

type ProfileRow = {
  id: string
  email: string | null
  username: string
  created_at: string
}

export async function createUser({
  id,
  email,
  username,
}: CreateUserInput): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id,
      email,
      username,
    })
    .select("id, email, username, created_at")
    .single<ProfileRow>()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    createdAt: data.created_at,
  }
}