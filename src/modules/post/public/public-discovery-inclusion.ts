import {
  filterPublicDiscoveryPostCandidates as filterPublicDiscoveryPostCandidatesInternal,
  getPublicDiscoveryPostState as getPublicDiscoveryPostStateInternal,
  isEligiblePublicDiscoveryCreator as isEligiblePublicDiscoveryCreatorInternal,
  isEligiblePublicDiscoveryCreatorRow as isEligiblePublicDiscoveryCreatorRowInternal,
  isEligiblePublicDiscoveryPost as isEligiblePublicDiscoveryPostInternal,
} from "@/modules/post/policies/public-discovery-inclusion"

export const PUBLIC_CONTRACT = true

export type PublicDiscoveryCreatorEligibilityInput = Parameters<
  typeof isEligiblePublicDiscoveryCreatorInternal
>[0]

export type PublicDiscoveryPostEligibilityInput = Parameters<
  typeof isEligiblePublicDiscoveryPostInternal
>[0]

export type PostPublicState = ReturnType<typeof getPublicDiscoveryPostStateInternal>

export type GetPostPublicStateInput = {
  status: string | null | undefined
  visibility: string | null | undefined
  visibilityStatus: string | null | undefined
  moderationStatus: string | null | undefined
  publishedAt: string | null | undefined
  deletedAt: string | null | undefined
  now: string
}

export function isEligiblePublicDiscoveryCreator(
  input: PublicDiscoveryCreatorEligibilityInput
): boolean {
  return isEligiblePublicDiscoveryCreatorInternal(input)
}

export function isEligiblePublicDiscoveryCreatorRow(
  creator: Parameters<typeof isEligiblePublicDiscoveryCreatorRowInternal>[0]
): boolean {
  return isEligiblePublicDiscoveryCreatorRowInternal(creator)
}

export function getPublicDiscoveryPostState(
  post: Parameters<typeof getPublicDiscoveryPostStateInternal>[0],
  now: string
): PostPublicState {
  return getPublicDiscoveryPostStateInternal(post, now)
}

export function isEligiblePublicDiscoveryPost(
  input: PublicDiscoveryPostEligibilityInput
): boolean {
  return isEligiblePublicDiscoveryPostInternal(input)
}

export function filterPublicDiscoveryPostCandidates<
  TPost extends Parameters<typeof filterPublicDiscoveryPostCandidatesInternal>[0][number],
>(
  posts: TPost[],
  now: string,
  allowedStates: PostPublicState[]
): ReturnType<typeof filterPublicDiscoveryPostCandidatesInternal<TPost>> {
  return filterPublicDiscoveryPostCandidatesInternal(posts, now, allowedStates)
}
