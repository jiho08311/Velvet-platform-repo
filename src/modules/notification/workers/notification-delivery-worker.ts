import {
  insertNotificationDeadLetter,
  insertNotificationDeliveryAttempt,
  insertNotificationDeliveryEvent,
  listPendingNotificationOutboxEvents,
  markNotificationOutboxDeadLetter,
  markNotificationOutboxDelivered,
  markNotificationOutboxFailed,
  markNotificationOutboxProcessing,
} from "@/modules/notification/repositories/notification-outbox-repository"

const NOTIFICATION_DEAD_LETTER_ATTEMPT_LIMIT = 5

function getNotificationRetryDelayMs(attemptCount: number): number {
  const retryDelays = [
    60 * 1000,
    5 * 60 * 1000,
    15 * 60 * 1000,
    60 * 60 * 1000,
    6 * 60 * 60 * 1000,
  ]

  return retryDelays[Math.min(attemptCount, retryDelays.length - 1)]
}

function getNextAttemptAt(attemptCount: number): string {
  return new Date(
    Date.now() + getNotificationRetryDelayMs(attemptCount),
  ).toISOString()
}

function resolveNotificationDeliveryError(error: unknown): {
  errorType: string
  errorMessage: string
} {
  return {
    errorType: "UNKNOWN",
    errorMessage:
      error instanceof Error ? error.message : "Unknown notification error",
  }
}

async function deliverNotificationOutboxEvent(): Promise<void> {
  // PR skeleton:
  // IN_APP delivery는 notification item 생성 시점에 이미 read model에 존재하므로
  // 현재는 outbox consume 성공만 기록한다.
  //
  // PUSH / EMAIL / WEBSOCKET provider dispatch는 후속 단계에서 붙인다.
}

export async function processNotificationOutboxRuntime(
  input: {
    limit?: number
  } = {},
) {
  const events = await listPendingNotificationOutboxEvents({
    limit: input.limit ?? 20,
  })

  let deliveredCount = 0
  let failedCount = 0
  let deadLetterCount = 0

  for (const event of events) {
    try {
      await markNotificationOutboxProcessing({
        outboxEventId: event.outbox_event_id,
      })

      await insertNotificationDeliveryAttempt({
        outboxEventId: event.outbox_event_id,
        notificationId: event.notification_id,
        channel: event.channel,
        status: "ATTEMPTED",
      })

      await insertNotificationDeliveryEvent({
        notificationId: event.notification_id,
        recipientUserId: event.recipient_user_id,
        eventType: "NotificationDeliveryAttempted",
        payload: {
          outboxEventId: event.outbox_event_id,
          notificationId: event.notification_id,
          channel: event.channel,
          attemptedAt: new Date().toISOString(),
        },
      })

      await deliverNotificationOutboxEvent()

      await markNotificationOutboxDelivered({
        outboxEventId: event.outbox_event_id,
      })

      await insertNotificationDeliveryAttempt({
        outboxEventId: event.outbox_event_id,
        notificationId: event.notification_id,
        channel: event.channel,
        status: "DELIVERED",
      })

      await insertNotificationDeliveryEvent({
        notificationId: event.notification_id,
        recipientUserId: event.recipient_user_id,
        eventType: "NotificationDelivered",
        payload: {
          outboxEventId: event.outbox_event_id,
          notificationId: event.notification_id,
          channel: event.channel,
          deliveredAt: new Date().toISOString(),
        },
      })

      deliveredCount += 1
    } catch (error) {
      const resolved = resolveNotificationDeliveryError(error)
      const nextAttemptCount = event.attempt_count + 1

      if (nextAttemptCount >= NOTIFICATION_DEAD_LETTER_ATTEMPT_LIMIT) {
        await markNotificationOutboxDeadLetter({
          outboxEventId: event.outbox_event_id,
          errorType: resolved.errorType,
          errorMessage: resolved.errorMessage,
        })

        await insertNotificationDeadLetter({
          outboxEventId: event.outbox_event_id,
          notificationId: event.notification_id,
          channel: event.channel,
          errorType: resolved.errorType,
          errorMessage: resolved.errorMessage,
          attemptCount: nextAttemptCount,
          payload: {
            notificationId: event.notification_id,
            recipientUserId: event.recipient_user_id,
            channel: event.channel,
          },
        })

        deadLetterCount += 1
      } else {
        await markNotificationOutboxFailed({
          outboxEventId: event.outbox_event_id,
          attemptCount: nextAttemptCount,
          errorType: resolved.errorType,
          errorMessage: resolved.errorMessage,
          nextAttemptAt: getNextAttemptAt(event.attempt_count),
        })

        failedCount += 1
      }

      await insertNotificationDeliveryAttempt({
        outboxEventId: event.outbox_event_id,
        notificationId: event.notification_id,
        channel: event.channel,
        status: "FAILED",
        errorType: resolved.errorType,
        errorMessage: resolved.errorMessage,
      })

      await insertNotificationDeliveryEvent({
        notificationId: event.notification_id,
        recipientUserId: event.recipient_user_id,
        eventType: "NotificationDeliveryFailed",
        payload: {
          outboxEventId: event.outbox_event_id,
          notificationId: event.notification_id,
          channel: event.channel,
          errorType: resolved.errorType,
          errorMessage: resolved.errorMessage,
          failedAt: new Date().toISOString(),
          attemptCount: nextAttemptCount,
          deadLettered:
            nextAttemptCount >= NOTIFICATION_DEAD_LETTER_ATTEMPT_LIMIT,
        },
      })
    }
  }

  return {
    processedCount: events.length,
    deliveredCount,
    failedCount,
    deadLetterCount,
  }
}