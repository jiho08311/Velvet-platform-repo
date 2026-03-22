import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type SubscriptionRow = {
  creator_id: string;
};

type PostRow = {
  id: string;
  creator_id: string;
  title: string | null;
  content: string | null;
  status: "draft" | "published" | "archived";
  visibility: "public" | "subscribers" | "paid";
  price_cents: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListFeedPostsInput = {
  userId: string;
  limit?: number;
};

export async function listFeedPosts({
  userId,
  limit = 20,
}: ListFeedPostsInput): Promise<
  Array<{
    id: string;
    creatorId: string;
    title?: string;
    content?: string;
    status: "draft" | "published" | "archived";
    visibility: "public" | "subscribers" | "paid";
    priceCents: number;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
  }>
> {
  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("subscriptions")
    .select("creator_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .returns<SubscriptionRow[]>();

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  const creatorIds = (subscriptions ?? []).map(
    (subscription) => subscription.creator_id
  );

  if (creatorIds.length === 0) {
    return [];
  }

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price_cents, published_at, created_at, updated_at"
    )
    .in("creator_id", creatorIds)
    .eq("status", "published")
    .in("visibility", ["public", "subscribers"])
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<PostRow[]>();

  if (postsError) {
    throw postsError;
  }

  return (posts ?? []).map((post) => ({
    id: post.id,
    creatorId: post.creator_id,
    title: post.title ?? undefined,
    content: post.content ?? undefined,
    status: post.status,
    visibility: post.visibility,
    priceCents: post.price_cents,
    publishedAt: post.published_at ?? undefined,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  }));
}