// src/modules/identity/runtime/execute-profile-display-update-runtime.ts
import { updateProfileDisplayIdentity } from "../repositories/profile-authority-repository"
import { randomUUID } from "node:crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import type { ProfileUpdatedPayload } from "@/modules/identity/contracts/profile-updated-event"
export async function executeProfileDisplayUpdate(input: {
  profileId: string
  displayName: string
  bio: string
  avatarUrl?: string | null
}) {
  const sanitizedDisplayName = input.displayName.trim()
  const sanitizedBio = input.bio.trim()

  const { data, error } = await updateProfileDisplayIdentity({
    profileId: input.profileId,
    displayName: sanitizedDisplayName,
    bio: sanitizedBio,
    avatarUrl: input.avatarUrl ?? null,
    context: {
      actorType: "user",
      reason: "profile_display_updated",
      sourceSurface: "profile.update",
      sourceSymbol: "executeProfileDisplayUpdate",
      occurredAt: new Date().toISOString(),
    },
  })

  if (error || !data) throw new Error("PROFILE_UPDATE_FAILED")

 

  const occurredAt = new Date().toISOString()
  const eventId = randomUUID()
  const metadata = data.aggregate_metadata ?? {}

  const payload: ProfileUpdatedPayload = {
    eventId,
    profileId: data.profile_id ?? input.profileId,
    userId: data.profile_id ?? input.profileId,
    username: data.username ?? null,
    displayName: data.display_name ?? null,
    avatarUrl: typeof metadata.avatarUrl === "string" ? metadata.avatarUrl : null,
    bio: typeof metadata.bio === "string" ? metadata.bio : sanitizedBio,
    version: 1,
    occurredAt,
  }

  const envelope: DomainEventEnvelope<ProfileUpdatedPayload> = {
    eventId,
    eventType: "ProfileUpdated",
    eventVersion: 1,
    aggregate: {
      aggregateType: "profile",
      aggregateId: payload.profileId,
    },
    source: {
      producerModule: "identity",
      producerSurface: "profile.display.update",
      sourceFile:
        "src/modules/identity/runtime/execute-profile-display-update-runtime.ts",
      sourceTable: "canonical_profiles",
      sourceRowId: payload.profileId,
    },
    actor: {
      actorType: "user",
      actorId: payload.userId,
    },
    subject: {
      userId: payload.userId,
    },
    correlation: {
      correlationId: eventId,
      causationId: null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt,
      recordedAt: occurredAt,
    },
    delivery: {
      idempotencyKey: `profile:${payload.profileId}:updated:${payload.version}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload,
    metadata: {
      eventFamily: "identity.profile",
      legacyRuntimePreserved: true,
      shadowMode: true,
      schemaName: "ProfileUpdatedPayload.v1",
    },
  }

  await writeDomainEventWithOutbox(envelope)



  return {
    id: data.profile_id ?? input.profileId,
    email: null,
    username: data.username,
    displayName: data.display_name ?? "",
    avatarUrl: typeof metadata.avatarUrl === "string" ? metadata.avatarUrl : null,
    bio: typeof metadata.bio === "string" ? metadata.bio : sanitizedBio,
    createdAt: data.created_at,
  }
}
