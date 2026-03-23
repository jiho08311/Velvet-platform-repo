// src/modules/user/server/get-user-by-id.ts

import type { User, UserId } from "@/modules/user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type ProfileUserRow = {
  id: string
  email: string | null
  username: string
  created_at: string
}

export async function getUserById(userId: UserId): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, username, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileUserRow>()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    email: data.email ?? "",
    username: data.username,
    role: "fan",
    status: "active",
    createdAt: data.created_at,
  }
}