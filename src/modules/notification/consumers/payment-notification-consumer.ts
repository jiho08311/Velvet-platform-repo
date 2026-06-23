import type { DomainEventEnvelope } from "@/modules/events/contracts"
import {
  createPaymentSucceededNotificationInput,
  createPpvMessagePurchasedNotificationInput,
  createPpvPostPurchasedNotificationInput,
} from "@/modules/notification/public/create-notification-input"
import {
  insertCanonicalNotification,
} from "@/modules/notification/repositories/canonical-notification-write-repository"
import type { PaymentType } from "@/modules/payment/types"

type PaymentConfirmedNotificationPayload = {
  paymentId: string
  paymentType: PaymentType
  userId: string
  creatorId?: string | null
  recipientUserId: string
}

function isPaymentConfirmedEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): event is DomainEventEnvelope<PaymentConfirmedNotificationPayload> {
  return event.eventType === "PaymentConfirmed"
}

export async function consumePaymentNotificationEvent(
  event: DomainEventEnvelope<Record<string, unknown>>,
): Promise<void> {
  if (!isPaymentConfirmedEvent(event)) {
    return
  }

  if (event.payload.recipientUserId === event.payload.userId) {
    const notificationInput = createPaymentSucceededNotificationInput({
      userId: event.payload.recipientUserId,
      paymentId: event.payload.paymentId,
    })

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "payment",
      sourceEntityType: "payment",
      sourceEntityId: event.payload.paymentId,
      actorUserId: event.payload.userId,
      correlationId: event.correlation.correlationId,
    })

    return
  }

  if (event.payload.paymentType === "ppv_message") {
    const notificationInput = createPpvMessagePurchasedNotificationInput({
      userId: event.payload.recipientUserId,
      paymentId: event.payload.paymentId,
    })

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "payment",
      sourceEntityType: "payment",
      sourceEntityId: event.payload.paymentId,
      actorUserId: event.payload.userId,
      correlationId: event.correlation.correlationId,
    })

    return
  }

  if (event.payload.paymentType === "ppv_post") {
    const notificationInput = createPpvPostPurchasedNotificationInput({
      userId: event.payload.recipientUserId,
      paymentId: event.payload.paymentId,
      buyerId: event.payload.userId,
      postId: String(event.payload.creatorId ?? event.payload.paymentId),
    })

    await insertCanonicalNotification({
      userId: notificationInput.userId,
      type: notificationInput.type,
      title: notificationInput.title,
      body: notificationInput.body,
      data: notificationInput.data ?? {},
      sourceDomain: "payment",
      sourceEntityType: "payment",
      sourceEntityId: event.payload.paymentId,
      actorUserId: event.payload.userId,
      correlationId: event.correlation.correlationId,
    })
  }
}