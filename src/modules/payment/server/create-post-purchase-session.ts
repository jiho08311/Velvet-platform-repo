import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type CreatePostPurchaseSessionInput = {
  postId: string
  userId: string
}

type PostRow = {
  id: string
  creator_id: string
  title: string | null
  content: string | null
  visibility: "public" | "subscribers" | "paid"
  price: number
}

type CreatorRow = {
  id: string
  user_id: string
}

type ProfileRow = {
  id: string
  username: string
  display_name: string
}

export type PostPurchasePaymentIntent = {
  postId: string
  userId: string
  creatorId: string
  amount: number
  currency: "KRW"
  orderName: string
}

async function getPost(postId: string): Promise<PostRow> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, creator_id, title, content, visibility, price")
    .eq("id", postId)
    .single<PostRow>()

  if (error) throw error
  return data
}

async function getCreator(creatorId: string): Promise<CreatorRow> {
  const { data, error } = await supabaseAdmin
    .from("creators")
    .select("id, user_id")
    .eq("id", creatorId)
    .single<CreatorRow>()

  if (error) throw error
  return data
}

async function getCreatorProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .single<ProfileRow>()

  if (error) throw error
  return data
}

export async function createPostPurchaseSession({
  postId,
  userId,
}: CreatePostPurchaseSessionInput): Promise<PostPurchasePaymentIntent> {
  const post = await getPost(postId)

  if (post.visibility !== "paid") {
    throw new Error("Post is not purchasable")
  }

  if (post.price <= 0) {
    throw new Error("Post price is invalid")
  }

  const creator = await getCreator(post.creator_id)
  const creatorProfile = await getCreatorProfile(creator.user_id)

  return {
    postId: post.id,
    userId,
    creatorId: post.creator_id,
    amount: post.price,
    currency: "KRW",

    // 🔥 핵심 수정 (PG 대응)
    orderName: "프리미엄 콘텐츠 이용권",
  }
}