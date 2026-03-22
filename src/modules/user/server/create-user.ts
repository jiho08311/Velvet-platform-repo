import type { User, UserRole, UserStatus } from "../types";
import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CreateUserInput = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
};

type UserRow = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
};

export async function createUser({
  id,
  email,
  username,
  role,
  status,
}: CreateUserInput): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      id,
      email,
      username,
      role,
      status,
    })
    .select("id, email, username, role, status, created_at")
    .single<UserRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
  };
}