import { randomUUID } from "crypto"

import {
  PHASE_5_SHADOW_AUTHORITY,
  type DomainEventEnvelope,
} from "@/modules/events/contracts"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import type { PaymentType } from "@/modules/payment/types"

export type PaymentConfirmedNotificationPayload = {
  paymentId: string
  paymentType: PaymentType
  userId: string
  creatorId?: string | null
  recipientUserId: string

  amount: number
  grossAmount: number
  netAmount: number
  platformFee: number
  currency: string
  occurredAt: string
}

export async function emitPaymentConfirmedNotificationEvent(
  payload: PaymentConfirmedNotificationPayload,
): Promise<void> {
  const now = new Date().toISOString()
  const eventId = randomUUID()

  const envelope: DomainEventEnvelope<PaymentConfirmedNotificationPayload> = {
    eventId,
    eventType: "PaymentConfirmed",
    eventVersion: 1,
    aggregate: {
      aggregateType: "payment",
      aggregateId: payload.paymentId,
    },
    source: {
      producerModule: "payment",
      producerSurface: "payment_confirmation_service",
      sourceFile: "src/modules/payment/services/payment-confirmation-service.ts",
      sourceTable: "payments",
      sourceRowId: payload.paymentId,
    },
    actor: {
      actorType: "system",
      actorId: payload.userId,
    },
    subject: {
      userId: payload.userId,
      creatorId: payload.creatorId ?? null,
      recipientUserId: payload.recipientUserId,
    },
    correlation: {
      correlationId: eventId,
      causationId: null,
      commandId: null,
      requestId: null,
    },
    timing: {
      occurredAt: now,
      recordedAt: now,
    },
    delivery: {
      idempotencyKey: `PaymentConfirmed:${payload.paymentId}:${payload.recipientUserId}`,
      outboxRequired: true,
      replayable: true,
    },
    authority: PHASE_5_SHADOW_AUTHORITY,
    payload,
    metadata: {
      eventFamily: "payment_notification",
      legacyRuntimePreserved: false,
      shadowMode: false,
      schemaName: "payment_confirmed_notification_v1",
    },
  }

  await writeDomainEventWithOutbox(envelope)
}
