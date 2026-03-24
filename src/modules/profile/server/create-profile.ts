import type { Profile, ProfileId } from "../types";
import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CreateProfileInput = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
};

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export async function createProfile({
  userId,
  email,
  username,
  displayName,
}: CreateProfileInput): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: userId,
      email,
      username,
      display_name: displayName,
    })
    .select("id, email, username, display_name, avatar_url, bio, created_at")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id as ProfileId,
    email: data.email,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    createdAt: data.created_at,
  };
}