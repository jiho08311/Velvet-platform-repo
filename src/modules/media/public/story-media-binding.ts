// src/modules/media/public/story-media-binding.ts

import { writeDomainEventWithOutbox } from "@/modules/events/public"
import { buildMediaEventEnvelope } from "@/modules/media/events"
import {
  createStoryMediaBinding as createStoryMediaBindingRepository,
  deleteStoryMediaBinding as deleteStoryMediaBindingRepository,
  findStoryMediaBindingsByStoryIds as findStoryMediaBindings,
} from "@/modules/media/repositories/story-media-binding-repository"

export const PUBLIC_CONTRACT = true

export type CreateStoryMediaBindingInput = Parameters<
  typeof createStoryMediaBindingRepository
>[0]
export type DeleteStoryMediaBindingInput = Parameters<
  typeof deleteStoryMediaBindingRepository
>[0]
export type StoryMediaBindingRow = Awaited<
  ReturnType<typeof createStoryMediaBindingRepository>
>

export async function findStoryMediaBindingsByStoryIds(
  storyIds: string[]
): Promise<StoryMediaBindingRow[]> {
  return findStoryMediaBindings(storyIds)
}

export async function deleteStoryMediaBinding(
  input: DeleteStoryMediaBindingInput
): Promise<void> {
  return deleteStoryMediaBindingRepository(input)
}

export async function createStoryMediaBinding(
  input: CreateStoryMediaBindingInput,
): Promise<StoryMediaBindingRow> {
  const row = await createStoryMediaBindingRepository(input)

  await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "StoryMediaBound",
      aggregateId: row.media_id,
      producerSurface: "media_public.story_media_binding",
      sourceFile: "src/modules/media/public/story-media-binding.ts",
     sourceTable: "story_media_bindings",
      sourceRowId: row.binding_id,
      actorId: null,
      payload: {
        storyId: row.story_id,
        assetId: row.media_id,
        bindingId: row.binding_id,
        bindingRole: row.binding_role,
        boundAt: row.created_at,
      },
      idempotencyKey: `story_media_bound:${row.story_id}:${row.media_id}:${row.binding_id}`,
      outboxRequired: true,
      replayable: true,
    }),
  )

  return row
}
