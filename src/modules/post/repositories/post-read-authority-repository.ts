import { findCanonicalPostByIdAsLegacyRow } from "./canonical-post-repository"
import { findPostById } from "./post-repository"

export async function readPostAuthority(postId: string) {
  const canonical = await findCanonicalPostByIdAsLegacyRow(postId)

  if (canonical) {
    return canonical
  }

  return findPostById(postId)
}