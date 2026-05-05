import { getPostById } from "@/modules/post/public/get-post"
import { createMediaSignedUrl } from "../public/create-media-signed-url"
import { findReadyPostMediaRowsByPostId } from "../repositories/media-repository"

type SecureMediaItem = {
  id: string
  postId: string
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType: string | null
  sortOrder: number
}

export async function getSecurePostMedia({
  postId,
  viewerUserId,
}: {
  postId: string
  viewerUserId?: string | null
}): Promise<SecureMediaItem[]> {
  const post = await getPostById(postId, viewerUserId ?? null)

  if (!post || post.isLocked) {
    return []
  }

  const mediaRows = await findReadyPostMediaRowsByPostId(postId)

  return Promise.all(
    mediaRows.map(async (media) => {
      const url = await createMediaSignedUrl({
        storagePath: media.storage_path,
        viewerUserId: viewerUserId ?? "",
        creatorUserId: post.creatorUserId,
        visibility: post.visibility,
        canView: post.canView,
      })

      return {
        id: media.id,
        postId: media.post_id,
        type: media.type,
        url,
        mimeType: media.mime_type,
        sortOrder: media.sort_order,
      }
    })
  )
}
