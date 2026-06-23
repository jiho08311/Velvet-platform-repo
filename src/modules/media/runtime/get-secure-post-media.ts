import {
  toSecurePostMediaResponse,
  type SecurePostMediaItemContract,
} from "@/modules/media/contracts/secure-post-media-contract"
import { resolveSecurePostMediaRuntime } from "@/modules/media/runtime/resolve-secure-post-media-runtime"

type SecureMediaItem = SecurePostMediaItemContract

export async function getSecurePostMedia({
  postId,
  viewerUserId,
}: {
  postId: string
  viewerUserId?: string | null
}): Promise<SecureMediaItem[]> {
  const contract = await resolveSecurePostMediaRuntime({
    postId,
    viewerUserId,
  })

  return toSecurePostMediaResponse(contract)
}