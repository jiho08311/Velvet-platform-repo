import { createMedia as createMediaServer } from "@/modules/media/server/create-media"
import type { Media, MediaStatus, MediaType } from "@/modules/media/types"

export type CreateMediaInput = {
  postId?: string | null
  messageId?: string | null
  ownerUserId?: string | null
  type: MediaType
  storagePath: string
  mimeType?: string
  sortOrder?: number
  status?: MediaStatus
  useInitialModerationState?: boolean
}

export async function createMedia(input: CreateMediaInput): Promise<Media> {
  return createMediaServer(input)
}
