import { randomUUID } from "node:crypto"
import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import type { CreatorActivatedPayload } from "@/modules/identity/contracts/creator-activated-event"
import {
  readCreatorAuthorityByCreatorId,
  updateCreatorConfiguration,
} from "../repositories/creator-authority-repository"

function assertValidSubscriptionPrice(price: number) {
  if (!Number.isInteger(price)) throw new Error("Invalid subscription price")
  if (price <= 0) throw new Error("Invalid subscription price")
  if (price > 10_000_000) throw new Error("Invalid subscription price")
}

export async function executeCreatorConfigurationUpdate(input: {
  creatorId: string
  status?: "pending" | "active" | "suspended"
  subscriptionPrice?: number
  subscriptionCurrency?: string
}) {
  if (input.subscriptionPrice !== undefined) {
    assertValidSubscriptionPrice(input.subscriptionPrice)
  }

  const { data: existing, error: existingError } =
    await readCreatorAuthorityByCreatorId(input.creatorId)

  if (existingError) throw existingError

  const previousStatus = existing?.status ?? null


  const { data, error } = await updateCreatorConfiguration({
    creatorId: input.creatorId,
    status: input.status,
    subscriptionPrice: input.subscriptionPrice,
    subscriptionCurrency: input.subscriptionCurrency,
    context: {
      actorType: "creator",
      reason: "creator_configuration_updated",
      sourceSurface: "creator.update",
      sourceSymbol: "executeCreatorConfigurationUpdate",
      occurredAt: new Date().toISOString(),
    },
  })

  if (error || !data?.creator_id || !data.user_id) {
    throw error ?? new Error("CREATOR_UPDATE_FAILED")
  }

  const metadata = data.aggregate_metadata ?? {}


    const shouldEmitCreatorActivated =
    previousStatus !== "active" && data.status === "active"

  if (shouldEmitCreatorActivated) {
    const activatedAt = new Date().toISOString()
    const eventId = randomUUID()

    const payload: CreatorActivatedPayload = {
      eventId,
      creatorId: data.creator_id,
      userId: data.user_id,
      username: data.username ?? null,
      activatedAt,
      category:
        typeof metadata.category === "string" ? metadata.category : null,
      country:
        typeof metadata.country === "string" ? metadata.country : null,
      activationVersion:
        typeof metadata.activationVersion === "number"
          ? metadata.activationVersion
          : 1,
    }

    const envelope: DomainEventEnvelope<CreatorActivatedPayload> = {
      eventId,
      eventType: "CreatorActivated",
      eventVersion: 1,
      aggregate: {
        aggregateType: "creator",
        aggregateId: payload.creatorId,
      },
      source: {
        producerModule: "identity",
        producerSurface: "creator.configuration.update",
        sourceFile:
          "src/modules/identity/runtime/execute-creator-configuration-update-runtime.ts",
        sourceTable: "canonical_creators",
        sourceRowId: payload.creatorId,
      },
actor: {
  actorType: "user",
  actorId: payload.userId,
},
      subject: {
        userId: payload.userId,
        creatorId: payload.creatorId,
      },
      correlation: {
        correlationId: eventId,
        causationId: null,
        commandId: null,
        requestId: null,
      },
      timing: {
        occurredAt: activatedAt,
        recordedAt: activatedAt,
      },
      delivery: {
        idempotencyKey: `creator:${payload.creatorId}:activated:${payload.activationVersion}`,
        outboxRequired: true,
        replayable: true,
      },
      authority: PHASE_5_SHADOW_AUTHORITY,
      payload,
      metadata: {
        eventFamily: "identity.creator",
        legacyRuntimePreserved: true,
        shadowMode: true,
        schemaName: "CreatorActivatedPayload.v1",
      },
    }

    await writeDomainEventWithOutbox(envelope)
  }

  return {
    id: data.creator_id,
    userId: data.user_id,
    status: data.status,
    subscriptionPrice:
      typeof metadata.subscriptionPrice === "number"
        ? metadata.subscriptionPrice
        : input.subscriptionPrice ?? 0,
    subscriptionCurrency:
      typeof metadata.subscriptionCurrency === "string"
        ? metadata.subscriptionCurrency
        : input.subscriptionCurrency ?? "KRW",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
