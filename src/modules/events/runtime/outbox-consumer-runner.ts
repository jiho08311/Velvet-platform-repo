import { randomUUID } from "crypto"
import { registerPhase5ShadowHandlers } from "./register-phase-5-shadow-handlers"
import {
  completeEventHandler,
  failEventHandler,
  tryStartEventHandler,
} from "@/modules/events/repositories/event-handler-idempotency-repository"
import {
  claimOutboxEvents,
  markOutboxDeadLetter,
  markOutboxProcessed,
  markOutboxSkipped,
  scheduleOutboxRetry,
} from "@/modules/events/repositories/outbox-event-processing-repository"
import { getHandlersForEvent } from "./event-handler-registry"
import { metrics } from "@/shared/observability/metrics"
function retryAvailableAt(attempts: number): string {
  const seconds = Math.min(60 * 30, Math.max(30, 2 ** attempts * 10))
  return new Date(Date.now() + seconds * 1000).toISOString()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function runOutboxConsumerBatch(input?: {
  workerId?: string
  batchSize?: number
  maxAttempts?: number
}): Promise<{
  claimed: number
  processed: number
  skipped: number
  failed: number
  deadLettered: number
}> {
  registerPhase5ShadowHandlers()

  const workerId = input?.workerId ?? `outbox-worker:${randomUUID()}`
  const maxAttempts = input?.maxAttempts ?? 10

  const events = await claimOutboxEvents({
    workerId,
    batchSize: input?.batchSize ?? 25,
  })

  const summary = {
    claimed: events.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    deadLettered: 0,
  }

  for (const event of events) {
        const startedAt = Date.now()
    const handlers = getHandlersForEvent(event.event_type)

    if (handlers.length === 0) {
      await markOutboxSkipped({
        outboxId: event.outbox_id,
        reason: `no_handler_registered:${event.event_type}`,
      })
      summary.skipped += 1
      continue
    }

    try {
      for (const handler of handlers) {
        const idempotencyKey = `${event.event_id}:${handler.handlerName}`

        const start = await tryStartEventHandler({
          eventId: event.event_id,
          handlerName: handler.handlerName,
          idempotencyKey,
        })

        if (!start.started && start.status === "completed") {
          continue
        }

        const result = await handler.handle(event)

        if (result.status === "skipped") {
          await completeEventHandler({
            eventId: event.event_id,
            handlerName: handler.handlerName,
            resultHash: result.reason ?? "skipped",
          })
          continue
        }

        await completeEventHandler({
          eventId: event.event_id,
          handlerName: handler.handlerName,
          resultHash: result.resultHash ?? null,
        })
      }

        await markOutboxProcessed(event.outbox_id)
      summary.processed += 1

      await metrics.increment({
        name: "outbox.success_count",
        consumerName: "domain_outbox_consumer",
        labels: {
          eventType: event.event_type,
        },
      })

      await metrics.timing({
        name: "outbox.processing_latency",
        consumerName: "domain_outbox_consumer",
        durationMs: Date.now() - startedAt,
        labels: {
          eventType: event.event_type,
        },
      })
    } catch (error) {
      const message = errorMessage(error)
      summary.failed += 1

      await metrics.increment({
        name: "outbox.failure_count",
        consumerName: "domain_outbox_consumer",
        labels: {
          eventType: event.event_type,
        },
      })


      for (const handler of handlers) {
        await failEventHandler({
          eventId: event.event_id,
          handlerName: handler.handlerName,
          errorMessage: message,
        }).catch(() => undefined)
      }

      if (event.attempts >= maxAttempts) {
             await markOutboxDeadLetter({
          outboxId: event.outbox_id,
          errorMessage: message,
        })
        summary.deadLettered += 1

        await metrics.increment({
          name: "outbox.dead_letter_count",
          consumerName: "domain_outbox_consumer",
          labels: {
            eventType: event.event_type,
            attempts: event.attempts,
          },
        })
      } else {
            await scheduleOutboxRetry({
          outboxId: event.outbox_id,
          errorMessage: message,
          availableAt: retryAvailableAt(event.attempts),
        })

        await metrics.increment({
          name: "outbox.retry_count",
          consumerName: "domain_outbox_consumer",
          labels: {
            eventType: event.event_type,
            attempts: event.attempts,
          },
        })
      }
    }
  }

  return summary
}
