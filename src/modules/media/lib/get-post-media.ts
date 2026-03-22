export type PostMediaItem = {
  id: string
  postId: string
  type: "image" | "video"
  fileUrl: string
  thumbnailUrl: string | null
  sortOrder: number
}

export async function getPostMedia(postId: string): Promise<PostMediaItem[]> {
  const id = postId.trim()

  if (!id) {
    return []
  }

  return []
}