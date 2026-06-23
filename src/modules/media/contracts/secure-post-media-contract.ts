import type { MediaType } from "@/modules/media/types"

export type SecurePostMediaItemContract = {
  id: string
  postId: string
  type: MediaType
  url: string
  mimeType: string | null
  sortOrder: number
}

export type SecurePostMediaContract = {
  items: SecurePostMediaItemContract[]
  lineage: {
    postId: string
    viewerUserId: string | null
    itemCount: number
  }
}

export function createSecurePostMediaContract({
  items,
  postId,
  viewerUserId,
}: {
  items: SecurePostMediaItemContract[]
  postId: string
  viewerUserId?: string | null
}): SecurePostMediaContract {
  return {
    items,
    lineage: {
      postId,
      viewerUserId: viewerUserId ?? null,
      itemCount: items.length,
    },
  }
}

export function toSecurePostMediaResponse(
  contract: SecurePostMediaContract
): SecurePostMediaItemContract[] {
  return contract.items
}