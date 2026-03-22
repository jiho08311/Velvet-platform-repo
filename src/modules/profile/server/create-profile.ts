import type { Profile, ProfileId } from "../types";
import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CreateProfileInput = {
  userId: string;
  username: string;
  displayName: string;
};

type ProfileRow = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export async function createProfile({
  userId,
  username,
  displayName,
}: CreateProfileInput): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      user_id: userId,
      username,
      display_name: displayName,
    })
    .select("id, user_id, username, display_name, avatar_url, bio")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id as ProfileId,
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url ?? "",
    bio: data.bio ?? "",
  };
}