// src/modules/media/public/post-media-binding.ts

import { writeDomainEventWithOutbox } from "@/modules/events/public"
import { buildMediaEventEnvelope } from "@/modules/media/events"
import {
  deletePostMediaBinding as deletePostMediaBindingRepository,
  createPostMediaBinding as createPostMediaBindingRepository,
  findPostMediaBindingsByPostIds as findPostMediaBindings,
} from "@/modules/media/repositories/post-media-binding-repository"

export const PUBLIC_CONTRACT = true

export type CreatePostMediaBindingInput = Parameters<
  typeof createPostMediaBindingRepository
>[0]
export type DeletePostMediaBindingInput = Parameters<
  typeof deletePostMediaBindingRepository
>[0]
export type PostMediaBindingRow = Awaited<
  ReturnType<typeof createPostMediaBindingRepository>
>

export async function findPostMediaBindingsByPostIds(
  postIds: string[]
): Promise<PostMediaBindingRow[]> {
  return findPostMediaBindings(postIds)
}

export async function deletePostMediaBinding(
  input: DeletePostMediaBindingInput
): Promise<void> {
  return deletePostMediaBindingRepository(input)
}

export async function createPostMediaBinding(
  input: CreatePostMediaBindingInput,
): Promise<PostMediaBindingRow> {
  const row = await createPostMediaBindingRepository(input)

  await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "PostMediaBound",
      aggregateId: row.media_id,
      producerSurface: "media_public.post_media_binding",
      sourceFile: "src/modules/media/public/post-media-binding.ts",
      sourceTable: "canonical_post_media_bindings",
      sourceRowId: row.binding_id,
      actorId: null,
      payload: {
        postId: row.post_id,
        assetId: row.media_id,
        bindingId: row.binding_id,
        bindingRole: row.binding_role,
        sortOrder: row.sort_order,
        boundAt: row.created_at,
      },
      idempotencyKey: `post_media_bound:${row.post_id}:${row.media_id}:${row.binding_id}`,
      outboxRequired: true,
      replayable: true,
    }),
  )

  return row
}
