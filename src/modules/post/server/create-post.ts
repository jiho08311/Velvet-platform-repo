import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CreatePostInput = {
  creatorId: string;
  title?: string | null;
  content?: string | null;
  status?: "draft" | "scheduled" | "published" | "archived";
  visibility?: "public" | "subscribers" | "paid";
  price?: number;
  publishedAt?: string | null;
};

type CreatorRow = {
  id: string;
};

type PostRow = {
  id: string;
  creator_id: string;
  title: string | null;
  content: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  visibility: "public" | "subscribers" | "paid";
  price: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function createPost({
  creatorId,
  title,
  content,
  status = "draft",
  visibility = "subscribers",
  price = 0,
  publishedAt,
}: CreatePostInput): Promise<{
  id: string;
  creatorId: string;
  title: string | null;
  content: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  visibility: "public" | "subscribers" | "paid";
  price: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}> {
  if (!["draft", "scheduled", "published", "archived"].includes(status)) {
    throw new Error("Invalid post status");
  }

  if (!["public", "subscribers", "paid"].includes(visibility)) {
    throw new Error("Invalid post visibility");
  }

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .maybeSingle<CreatorRow>();

  if (creatorError) {
    throw creatorError;
  }

  if (!creator) {
    throw new Error("Only creators can create posts");
  }

  const resolvedPrice = visibility === "paid" ? price : 0;

  if (visibility === "paid" && resolvedPrice <= 0) {
    throw new Error("Paid post price must be greater than 0");
  }

  const now = new Date().toISOString();

  const resolvedPublishedAt =
    publishedAt !== undefined
      ? publishedAt
      : status === "published"
        ? now
        : null;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      creator_id: creatorId,
      title,
      content,
      status,
      visibility,
      price: resolvedPrice,
      published_at: resolvedPublishedAt,
      created_at: now,
      updated_at: now,
    })
    .select(
      "id, creator_id, title, content, status, visibility, price, published_at, created_at, updated_at"
    )
    .single<PostRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    creatorId: data.creator_id,
    title: data.title,
    content: data.content,
    status: data.status,
    visibility: data.visibility,
    price: data.price,
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}