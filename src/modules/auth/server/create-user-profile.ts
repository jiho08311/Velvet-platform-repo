import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CreateUserProfileInput = {
  id: string;
  email: string;
  displayName: string;
  username: string;
};

export function buildDefaultUsername(email: string, userId: string) {
  const base =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";

  return `${base}_${userId.slice(0, 8)}`;
}

export async function createUserProfile({
  id,
  email,
  displayName,
  username,
}: CreateUserProfileInput) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id,
        email,
        display_name: displayName,
        username,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("createUserProfile error:", error);
    throw error;
  }

  return data;
}