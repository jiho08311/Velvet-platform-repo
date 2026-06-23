import { randomUUID } from "crypto"

import type { CreateMediaSignedUrlInput } from "@/modules/media/public/create-media-signed-url"
import { createMediaSignedUrl } from "@/modules/media/public/create-media-signed-url"
import { insertMediaServingAuthorization } from "@/modules/media/repositories/media-serving-authorization-repository"
import { writeDomainEventWithOutbox } from "@/modules/events/public"
import { buildMediaEventEnvelope } from "@/modules/media/events"

export type ServeMediaUrlInput = CreateMediaSignedUrlInput & {
  contentType?: "post" | "story" | "message" | null
  contentId?: string | null
}

export async function serveMediaUrl(input: ServeMediaUrlInput): Promise<string> {
  const correlationId = randomUUID()
  const url = await createMediaSignedUrl(input)
  const allowed = !!url

  const expiresAt = new Date(
    Date.now() + (input.expiresIn ?? 60 * 60) * 1000,
  ).toISOString()

  await insertMediaServingAuthorization({
    assetId: input.mediaId || null,
    storagePath: input.storagePath,
    principalId: input.viewerUserId || null,
    creatorUserId: input.creatorUserId || null,
    contentType: input.contentType ?? null,
    contentId: input.contentId ?? null,
    decision: allowed ? "allowed" : "denied",
    accessReason: allowed ? "SIGNED_URL_ISSUED" : "SIGNED_URL_DENIED",
    capabilityKind: input.capabilityKind ?? null,
    capabilitySurface: input.capabilitySurface ?? null,
    expiresAt: allowed ? expiresAt : null,
    correlationId,
  })

  await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "MediaAccessEvaluated",
      aggregateId: input.mediaId || input.storagePath,
      producerSurface: "media_serving.serve_media_url",
      sourceFile: "src/modules/media/serving/serve-media-url.ts",
      sourceTable: "media_serving_authorizations",
      sourceRowId: null,
      actorId: input.viewerUserId || null,
      subjectUserId: input.creatorUserId || null,
      payload: {
        assetId: input.mediaId || null,
        storagePath: input.storagePath,
        principalId: input.viewerUserId || null,
        creatorUserId: input.creatorUserId || null,
        contentType: input.contentType ?? null,
        contentId: input.contentId ?? null,
        decision: allowed ? "allowed" : "denied",
        reason: allowed ? "SIGNED_URL_ISSUED" : "SIGNED_URL_DENIED",
        capabilityKind: input.capabilityKind ?? null,
        capabilitySurface: input.capabilitySurface ?? null,
        evaluatedAt: new Date().toISOString(),
      },
      idempotencyKey: `media_access_evaluated:${correlationId}`,
      outboxRequired: false,
      replayable: false,
      correlationId,
    }),
  )

  return url
}