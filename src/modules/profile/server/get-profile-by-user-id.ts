import type { Profile } from "../types";
import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type ProfileRow = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, username, display_name, avatar_url, bio")
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url ?? "",
    bio: data.bio ?? "",
  };
}