import {
  getStoryReadStateMap as getStoryReadStateMapRuntime,
  markStoryReadState as markStoryReadStateRuntime,
} from "@/modules/story/runtime/story-read-state"
import type {
  StoryReadStateWriteParams,
  StoryReadStateWriteResult,
} from "@/modules/story/types"

export const PUBLIC_CONTRACT = true

export type { StoryReadStateWriteParams, StoryReadStateWriteResult }

export async function getStoryReadStateMap(
  viewerUserId: string
): Promise<Map<string, string>> {
  return getStoryReadStateMapRuntime(viewerUserId)
}

export async function markStoryReadState(
  params: StoryReadStateWriteParams
): Promise<StoryReadStateWriteResult> {
  return markStoryReadStateRuntime(params)
}
