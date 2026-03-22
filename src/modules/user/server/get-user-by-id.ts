import type { User, UserId, UserRole, UserStatus } from "../types"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UserRow = {
  id: string
  email: string
  username: string
  role: UserRole
  status: UserStatus
  created_at: string
}

export async function getUserById(userId: UserId): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, username, role, status, created_at")
    .eq("id", userId)
    .maybeSingle<UserRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
  }
}