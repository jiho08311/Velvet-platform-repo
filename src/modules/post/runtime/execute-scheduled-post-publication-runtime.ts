import { publishDueCanonicalPosts } from "@/modules/post/repositories/post-canonical-write-repository"

export async function executeScheduledPostPublicationRuntime() {
  const now = new Date().toISOString()

  await publishDueCanonicalPosts(now)
}