import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type UpdatePostInput = {
  postId: string;
  creatorId: string;
  title?: string | null;
  content?: string | null;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "subscribers" | "paid";
  priceCents?: number;
  publishedAt?: string | null;
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
  deleted_at: string | null;
};

export async function updatePost({
  postId,
  creatorId,
  title,
  content,
  status,
  visibility,
  priceCents,
  publishedAt,
}: UpdatePostInput): Promise<{
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
}> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    updateData.title = title;
  }

  if (content !== undefined) {
    updateData.content = content;
  }

  if (status !== undefined) {
    if (!["draft", "published", "archived"].includes(status)) {
      throw new Error("Invalid post status");
    }

    updateData.status = status;
  }

  if (visibility !== undefined) {
    if (!["public", "subscribers", "paid"].includes(visibility)) {
      throw new Error("Invalid post visibility");
    }

    updateData.visibility = visibility;
  }

  if (priceCents !== undefined) {
    updateData.price_cents = priceCents;
  }

  if (publishedAt !== undefined) {
    updateData.published_at = publishedAt;
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(updateData)
    .eq("id", postId)
    .eq("creator_id", creatorId)
    .is("deleted_at", null)
    .select(
      "id, creator_id, title, content, status, visibility, price_cents, published_at, created_at, updated_at, deleted_at"
    )
    .single<PostRow>();

  if (error) {
    throw error;
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