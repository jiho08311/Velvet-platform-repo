import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type PostRow = {
  id: string;
  creator_id: string;
  title: string | null;
  content: string | null;
  status: "draft" | "published" | "archived";
  visibility: "public" | "subscribers";
  price_cents: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPostById(postId: string): Promise<{
  id: string;
  creatorId: string;
  title?: string;
  content?: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "subscribers";
  priceCents: number | null;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
} | null> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(
      "id, creator_id, title, content, status, visibility, price_cents, published_at, created_at, updated_at"
    )
    .eq("id", postId)
    .maybeSingle<PostRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    title: data.title ?? undefined,
    content: data.content ?? undefined,
    status: data.status,
    visibility: data.visibility,
    priceCents: data.price_cents,
    publishedAt: data.published_at ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}