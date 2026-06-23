import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/public/event-handler-registry"
import { recordRevenueMetricFromEvent } from "@/modules/analytics/workers/revenue-rollup-worker"

export const revenueRollupEventHandler: EventHandler = {
  handlerName: "analytics-revenue-rollup-worker",
  eventTypes: [
    "PaymentConfirmed",
    "PaymentRefunded",
    "LedgerMutationObserved",
  ],

  async handle(event): Promise<EventHandlerResult> {
    const result = await recordRevenueMetricFromEvent(event)

    if (result.status === "skipped") {
      return {
        status: "skipped",
        reason: result.reason,
      }
    }

    return {
      status: "completed",
      resultHash: `revenue:${event.event_id}`,
    }
  },
}
