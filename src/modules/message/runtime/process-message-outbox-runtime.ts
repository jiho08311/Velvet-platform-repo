
import {
  listPendingMessageOutboxEvents,
  markMessageOutboxEventFailed,
  markMessageOutboxEventPublished,
} from "@/modules/message/repositories/message-outbox-repository"
import { metrics } from "@/shared/observability/metrics"
import {
  bridgeMessageOutboxEventToDomainOutbox,
} from "@/modules/message/repositories/message-domain-event-bridge-repository"
export async function processMessageOutboxRuntime(input: {
  limit?: number
} = {}) {
  const events = await listPendingMessageOutboxEvents({
    limit: input.limit ?? 20,
  })

  let publishedCount = 0
  let failedCount = 0

  for (const event of events) {
        const startedAt = Date.now()
    try {
      if (event.event_type !== "message.sent") {
        await markMessageOutboxEventFailed({
          eventId: event.id,
          errorMessage: `Unsupported event type: ${event.event_type}`,
        })
              failedCount += 1

        await metrics.increment({
          name: "outbox.failure_count",
          consumerName: "message_outbox_consumer",
          labels: {
            eventType: event.event_type,
            reason: "unsupported_event_type",
          },
        })

        continue
      }

await bridgeMessageOutboxEventToDomainOutbox(event)

      await markMessageOutboxEventPublished({
        eventId: event.id,
      })

      publishedCount += 1

      await metrics.increment({
        name: "outbox.success_count",
        consumerName: "message_outbox_consumer",
        labels: {
          eventType: event.event_type,
        },
      })

      await metrics.timing({
        name: "outbox.processing_latency",
        consumerName: "message_outbox_consumer",
        durationMs: Date.now() - startedAt,
        labels: {
          eventType: event.event_type,
        },
      })
    } catch (error) {
      await markMessageOutboxEventFailed({
        eventId: event.id,
        errorMessage:
          error instanceof Error ? error.message : "Unknown outbox error",
      })

      failedCount += 1

      await metrics.increment({
        name: "outbox.failure_count",
        consumerName: "message_outbox_consumer",
        labels: {
          eventType: event.event_type,
        },
      })
    }
  }

  return {
    processedCount: events.length,
    publishedCount,
    failedCount,
  }
}