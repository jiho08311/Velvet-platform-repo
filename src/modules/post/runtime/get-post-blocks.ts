
import { readPostBlockAuthority } from "@/modules/post/repositories/post-block-read-authority-repository"
export async function getPostBlocks(postId: string) {
  return readPostBlockAuthority(postId)
}