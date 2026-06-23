import {
  applyContentModerationVisibility as applyContentModerationVisibilityRepository,
} from "@/modules/post/repositories/post-canonical-write-repository"

export const PUBLIC_CONTRACT = true

export type ApplyContentModerationVisibilityInput = Parameters<
  typeof applyContentModerationVisibilityRepository
>[0]

export type ContentModerationVisibility =
  ApplyContentModerationVisibilityInput["visibility"]

export async function applyContentModerationVisibility(
  input: ApplyContentModerationVisibilityInput
): Promise<void> {
  return applyContentModerationVisibilityRepository(input)
}
