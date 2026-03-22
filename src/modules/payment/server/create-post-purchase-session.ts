import { supabaseAdmin } from "@/infrastructure/supabase/admin";

type CreatePostPurchaseSessionInput = {
  postId: string;
  userId: string;
};

type UserRow = {
  id: string;
};

type PostRow = {
  id: string;
  creator_id: string;
  title: string | null;
  content: string | null;
  visibility: "public" | "subscribers" | "paid";
  price_cents: number;
};

type CreatorRow = {
  id: string;
  user_id: string;
};

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
};

export type PostPurchasePaymentIntent = {
  postId: string;
  userId: string;
  creatorId: string;
  amount: number;
  currency: "KRW";
  orderName: string;
};

async function getUser(userId: string): Promise<UserRow> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .single<UserRow>();

  if (error) throw error;
  return data;
}

async function getPost(postId: string): Promise<PostRow> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, title, content, visibility, price_cents")
    .eq("id", postId)
    .single<PostRow>();

  if (error) throw error;
  return data;
}

async function getCreator(creatorId: string): Promise<CreatorRow> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .eq("id", creatorId)
    .single<CreatorRow>();

  if (error) throw error;
  return data;
}

async function getCreatorProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, username, display_name")
    .eq("user_id", userId)
    .single<ProfileRow>();

  if (error) throw error;
  return data;
}

export async function createPostPurchaseSession({
  postId,
  userId,
}: CreatePostPurchaseSessionInput): Promise<PostPurchasePaymentIntent> {
  const [user, post] = await Promise.all([
    getUser(userId),
    getPost(postId),
  ]);

  if (post.visibility !== "paid") {
    throw new Error("Post is not purchasable");
  }

  if (post.price_cents <= 0) {
    throw new Error("Post price is invalid");
  }

  const creator = await getCreator(post.creator_id);
  const creatorProfile = await getCreatorProfile(creator.user_id);

  return {
    postId: post.id,
    userId: user.id,
    creatorId: post.creator_id,
    amount: post.price_cents,
    currency: "KRW",
    orderName:
      post.title?.trim() || `${creatorProfile.display_name} Paid Post`,
  };
}