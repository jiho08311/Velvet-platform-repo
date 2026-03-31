import { canViewPost } from "./can-view-post"

type GetPostAccessInput = {
  viewerUserId: string | null
  post: {
    id: string
    creatorId: string
    content?: string
    visibility: "public" | "subscribers" | "paid"
    priceCents: number
    createdAt: string
  }
  creator: {
    userId: string
  }
  isSubscribedResult: boolean
  hasPurchasedResult: boolean
}

export async function getPostAccess({
  viewerUserId,
  post,
  creator,
  isSubscribedResult,
  hasPurchasedResult,
}: GetPostAccessInput): Promise<{
  canView: boolean
}> {
  // 🔥 핵심 추가: creator 본인은 무조건 접근 가능
  if (viewerUserId && viewerUserId === creator.userId) {
    return {
      canView: true,
    }
  }

  const canView = canViewPost({
    viewerUserId: viewerUserId ?? null,
    creatorId: creator.userId,
    visibility: post.visibility,
    isSubscribed: isSubscribedResult,
    hasPurchased: hasPurchasedResult,
  })

  return {
    canView,
  }
}