import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { writeDomainEventWithOutbox } from "@/modules/events/public/write-domain-event-with-outbox"
import { requireSession } from "@/modules/auth/public/require-session"
import {
  confirmPayment,
  getPaymentById,
} from "@/modules/commerce/public/payment-contract"

import { getMessageConfirmationTarget } from "@/modules/message/public/get-message-confirmation-target"
import { InfrastructureError } from "@/shared/errors"

type ConfirmMessageRequestBody = {
  paymentId?: string
  messageId?: string
}

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = (await request.json()) as ConfirmMessageRequestBody

    const paymentId = body.paymentId
    const messageId = body.messageId

    if (!paymentId || !messageId) {
      return NextResponse.json(
        { error: "paymentId and messageId are required" },
        { status: 400 }
      )
    }

    const message = await getMessageConfirmationTarget(messageId)

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const { payment } = await getPaymentById({
      paymentId,
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.payerUserId !== session.userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    if (payment.purpose !== "ppv_message") {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      )
    }

    if (payment.target?.type !== "message" || payment.target.id !== messageId) {
      return NextResponse.json(
        { error: "Payment does not match message" },
        { status: 400 }
      )
    }

    const result = await confirmPayment({
      paymentId,
    })

    if (result.payment.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment confirmation failed" },
        { status: 400 }
      )
    }

    const grantTarget = await getMessageConfirmationTarget(messageId)

    if (!grantTarget) {
      throw new InfrastructureError("MESSAGE_GRANT_TARGET_NOT_FOUND", {
        metadata: {
          paymentId,
          messageId,
          viewerUserId: session.userId,
        },
      })
    }

const now = new Date().toISOString()

await writeDomainEventWithOutbox({
  eventId: randomUUID(),
  eventType: "PpvMessagePurchased",
  eventVersion: 1,
  aggregate: {
    aggregateType: "payment",
    aggregateId: paymentId,
  },
  source: {
    producerModule: "payment",
    producerSurface: "api.payment.confirm-message",
    sourceFile: "src/app/api/payment/confirm-message/route.ts",
    sourceTable: "payments",
    sourceRowId: paymentId,
  },
  actor: {
    actorType: "user",
    actorId: session.userId,
  },
  subject: {
    userId: session.userId,
    creatorId: null,
    recipientUserId: null,
  },
  correlation: {
    correlationId: paymentId,
    causationId: paymentId,
    commandId: null,
    requestId: null,
  },
  timing: {
    occurredAt: now,
    recordedAt: now,
  },
  delivery: {
    idempotencyKey: `payment:${paymentId}:ppv-message-purchased`,
    outboxRequired: true,
    replayable: true,
  },
  authority: {
    runtimeAuthoritative: true,
    canonicalAuthoritative: true,
    projectionAuthoritative: false,
    servingAuthoritative: false,
    replayAuthoritative: true,
    promotionAllowed: true,
    rollbackSafe: true,
    failOpen: false,
  },
  payload: {
    paymentId,
    messageId: grantTarget.id,
    conversationId: grantTarget.conversation_id,
    buyerId: session.userId,
    purchasedAt: now,
  },
  metadata: {
    eventFamily: "ppv_message_purchase",
    legacyRuntimePreserved: false,
    shadowMode: false,
    diagnostics: {
      previousRuntimeSurface: "api.payment.confirm-message",
      replacedDirectGrant: true,
    },
  },
})

    return NextResponse.json(
      {
        success: true,
        payment: result.payment,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to confirm message payment" },
      { status: 500 }
    )
  }
}
