import { buildPublicCreatorProfileVisibilityInput } from "@/modules/creator/lib/build-public-creator-profile-visibility-input"
import { isPublicCreatorProfileVisible } from "@/modules/creator/lib/is-public-creator-profile-visible"
import {
  getPostPublicState,
  type PostPublicState,
} from "@/modules/post/lib/get-post-public-state"

type PublicDiscoveryCreatorProfile = {
  is_deactivated: boolean | null
  is_delete_pending: boolean | null
  deleted_at: string | null
  is_banned: boolean | null
} | null

type PublicDiscoveryCreatorStatus = {
  status: "active" | "pending" | "suspended" | "inactive" | null | undefined
} | null

type PublicDiscoveryCreatorRow = {
  status: "active" | "pending" | "suspended" | "inactive"
  profiles: PublicDiscoveryCreatorProfile
}

type PublicDiscoveryPostRow = {
  status?: string | null | undefined
  visibility?: string | null | undefined
  visibility_status?: string | null | undefined
  moderation_status?: string | null | undefined
  published_at?: string | null | undefined
  deleted_at?: string | null | undefined
}

type PublicDiscoveryPostCandidate<TPost> = {
  post: TPost
  publicState: PostPublicState
}

export type PublicDiscoveryCreatorEligibilityInput = {
  creator: PublicDiscoveryCreatorStatus
  profile: PublicDiscoveryCreatorProfile
}

export function isEligiblePublicDiscoveryCreator(
  input: PublicDiscoveryCreatorEligibilityInput
): boolean {
  return isPublicCreatorProfileVisible(
    buildPublicCreatorProfileVisibilityInput({
      creator: input.creator,
      profile: input.profile,
    })
  )
}

export function isEligiblePublicDiscoveryCreatorRow(
  creator: PublicDiscoveryCreatorRow
): boolean {
  return isEligiblePublicDiscoveryCreator({
    creator: {
      status: creator.status,
    },
    profile: creator.profiles,
  })
}

export function getPublicDiscoveryPostState(
  post: PublicDiscoveryPostRow,
  now: string
): PostPublicState {
  return getPostPublicState({
    status: post.status,
    visibility: post.visibility,
    visibilityStatus: post.visibility_status,
    moderationStatus: post.moderation_status,
    publishedAt: post.published_at,
    deletedAt: post.deleted_at,
    now,
  })
}

export type PublicDiscoveryPostEligibilityInput = {
  post: PublicDiscoveryPostRow
  now: string
  allowedStates: PostPublicState[]
}

export function isEligiblePublicDiscoveryPost(
  input: PublicDiscoveryPostEligibilityInput
): boolean {
  return input.allowedStates.includes(
    getPublicDiscoveryPostState(input.post, input.now)
  )
}

export function filterPublicDiscoveryPostCandidates<
  TPost extends PublicDiscoveryPostRow,
>(
  posts: TPost[],
  now: string,
  allowedStates: PostPublicState[]
): Array<PublicDiscoveryPostCandidate<TPost>> {
  return posts
    .map((post) => ({
      post,
      publicState: getPublicDiscoveryPostState(post, now),
    }))
    .filter(({ post }) =>
      isEligiblePublicDiscoveryPost({
        post,
        now,
        allowedStates,
      })
    )
}
