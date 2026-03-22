import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type ProfileLookupRow = {
  id: string;
  username: string;
  display_name: string;
};

type CreatorRow = {
  id: string;
  user_id: string;
  status: "pending" | "active" | "suspended";
  subscription_price_cents: number;
  subscription_currency: string;
  created_at: string;
  updated_at: string;
  username: string;
};

export async function getCreatorByUsername(username: string) {
  const name = username.trim().toLowerCase();

  if (!name) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", name)
    .maybeSingle<ProfileLookupRow>();

  if (profileError) throw profileError;
  if (!profile) return null;

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(
      "id, user_id, status, subscription_price_cents, subscription_currency, created_at, updated_at, username"
    )
    .eq("user_id", profile.id)
    .maybeSingle<CreatorRow>();

  if (creatorError) throw creatorError;
  if (!creator) return null;

  return {
    id: creator.id,
    userId: creator.user_id,
    username: creator.username,
    displayName: profile.display_name,
    avatarUrl: "",
    bio: "",
    status: creator.status,
    subscriptionPriceCents: creator.subscription_price_cents,
    subscriptionCurrency: creator.subscription_currency,
    createdAt: creator.created_at,
    updatedAt: creator.updated_at,
  };
}