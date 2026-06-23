import { loadProfileCreatorContent } from "./profile-page-creator-data"
import { loadProfileIdentity } from "./profile-page-user-data"

export async function loadProfilePageData(userId: string) {
  const [profile, creatorContent] = await Promise.all([
    loadProfileIdentity(userId),
    loadProfileCreatorContent(userId),
  ])

  return {
    profile,
    ...creatorContent,
  }
}
