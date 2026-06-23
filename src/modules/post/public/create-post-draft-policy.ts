import {
  extractCreatePostModerationFiles as extractCreatePostModerationFilesInternal,
  projectCreatePostDraft as projectCreatePostDraftInternal,
  resolveCreatePostPersistenceFromProjection as resolveCreatePostPersistenceFromProjectionInternal,
} from "@/modules/post/policies/create-post-draft-policy"

export const PUBLIC_CONTRACT = true

export type ExtractCreatePostModerationFilesInput = Parameters<
  typeof extractCreatePostModerationFilesInternal
>[0]

export type ProjectCreatePostDraftInput = Parameters<
  typeof projectCreatePostDraftInternal
>[0]

export type ResolveCreatePostPersistenceFromProjectionInput = Parameters<
  typeof resolveCreatePostPersistenceFromProjectionInternal
>[0]

export function extractCreatePostModerationFiles(
  input: ExtractCreatePostModerationFilesInput
): ReturnType<typeof extractCreatePostModerationFilesInternal> {
  return extractCreatePostModerationFilesInternal(input)
}

export function projectCreatePostDraft(
  input: ProjectCreatePostDraftInput
): ReturnType<typeof projectCreatePostDraftInternal> {
  return projectCreatePostDraftInternal(input)
}

export function resolveCreatePostPersistenceFromProjection(
  input: ResolveCreatePostPersistenceFromProjectionInput
): ReturnType<typeof resolveCreatePostPersistenceFromProjectionInternal> {
  return resolveCreatePostPersistenceFromProjectionInternal(input)
}
