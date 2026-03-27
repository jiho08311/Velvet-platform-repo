import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type CreatorRow = {
  id: string;
  user_id: string;
  username: string | null;
  subscription_price_cents: number | null;
  subscription_currency: string | null;
  status: "active" | "banned" | "suspended";
  created_at: string;
};

export type CreatorAdminDetail = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  subscriptionPriceCents: number;
  subscriptionCurrency: string;
  status: "active" | "banned" | "suspended";
  createdAt: string;
};

export async function getCreatorById(
  creatorId: string
): Promise<CreatorAdminDetail | null> {
  const id = creatorId.trim();

  if (!id) {
    return null;
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select(
      `
      id,
      user_id,
      username,
      status,
      subscription_price_cents,
      subscription_currency,
      created_at
    `
    )
    .eq("id", id)
    .maybeSingle<CreatorRow>();

  if (creatorError) {
    throw new Error("Failed to load creator");
  }

  if (!creator) {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", creator.user_id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    throw new Error("Failed to load creator profile");
  }

  return {
    id: creator.id,
    userId: creator.user_id,
    username: profile?.username ?? creator.username ?? "",
    displayName: profile?.display_name ?? "",
    subscriptionPriceCents: creator.subscription_price_cents ?? 0,
    subscriptionCurrency: creator.subscription_currency ?? "KRW",
    status: creator.status,
    createdAt: creator.created_at,
  };
}