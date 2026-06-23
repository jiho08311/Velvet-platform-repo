import {
  createSecurePostMediaContract,
  type SecurePostMediaContract,
} from "@/modules/media/contracts/secure-post-media-contract"
import { serveMediaUrl } from "@/modules/media/serving"
import { listPostMedia } from "@/modules/media/public/list-post-media"
import { getPostById } from "@/modules/post/public/get-post"

export type ExecuteSecurePostMediaRuntimeInput = {
  postId: string
  viewerUserId?: string | null
}

export async function executeSecurePostMediaRuntime({
  postId,
  viewerUserId,
}: ExecuteSecurePostMediaRuntimeInput): Promise<SecurePostMediaContract> {
  const post = await getPostById(postId, viewerUserId ?? null)

  if (!post || post.isLocked) {
    return createSecurePostMediaContract({
      items: [],
      postId,
      viewerUserId,
    })
  }

  const mediaRows = await listPostMedia({
    postIds: [postId],
    requireReadyAsset: true,
  })

  const items = await Promise.all(
   
    mediaRows.map(async (media) => {
      const url = await serveMediaUrl({
        storagePath: media.media.storagePath,
        viewerUserId: viewerUserId ?? "",
        creatorUserId: post.creatorUserId,
        visibility: post.visibility,
        canView: post.canView,
        mediaId: media.media.id,
        capabilitySurface: "post_media_signing",
        capabilityKind: "post_media_signed_url",
      })

      return {
   id: media.media.id,
        postId: media.postId,
        type: media.media.mediaType,
        url,
        mimeType: media.media.mimeType,
        sortOrder: media.sortOrder,
      }
    })
  )

  return createSecurePostMediaContract({
    items,
    postId,
    viewerUserId,
  })
}
