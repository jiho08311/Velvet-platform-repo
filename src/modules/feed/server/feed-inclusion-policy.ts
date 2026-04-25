import type { PostPublicState } from "@/modules/post/lib/get-post-public-state"
import {
  getPublicDiscoveryPostState,
  isEligiblePublicDiscoveryCreator,
} from "@/modules/post/lib/public-discovery-inclusion"

type FeedCreatorVisibilityProfile = {
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
} | null

type FeedCreatorVisibilityRow = {
  id: string
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: FeedCreatorVisibilityProfile
}

type FeedPostPublicStateRow = {
  status?: string | null | undefined
  visibility?: string | null | undefined
  visibility_status?: string | null | undefined
  moderation_status?: string | null | undefined
  published_at?: string | null | undefined
  deleted_at?: string | null | undefined
}

type FeedPostCandidate<TPost> = {
  post: TPost
  publicState: PostPublicState
}

export function isVisibleFeedCreator(
  creator: FeedCreatorVisibilityRow
): boolean {
  return isEligiblePublicDiscoveryCreator({
    creator: {
      status: creator.status,
    },
    profile: creator.profiles,
  })
}

export function getFeedPostPublicState(
  post: FeedPostPublicStateRow,
  now: string
): PostPublicState {
  return getPublicDiscoveryPostState(post, now)
}

export function filterFeedPostCandidates<TPost extends FeedPostPublicStateRow>(
  posts: TPost[],
  now: string,
  allowedStates: PostPublicState[]
): Array<FeedPostCandidate<TPost>> {
  return posts
    .map((post) => ({
      post,
      publicState: getFeedPostPublicState(post, now),
    }))
    .filter(({ publicState }) => allowedStates.includes(publicState))
}
