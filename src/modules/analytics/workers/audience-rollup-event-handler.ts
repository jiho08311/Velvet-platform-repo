import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/public/event-handler-registry"
import { recordAudienceMetricFromEvent } from "@/modules/analytics/workers/audience-rollup-worker"

export const audienceRollupEventHandler: EventHandler = {
  handlerName: "analytics-audience-rollup-worker",
  eventTypes: [
    "SubscriptionActivated",
    "SubscriptionCancelled",
    "EntitlementGrantObserved",
    "EntitlementRevokeObserved",
  ],

  async handle(event): Promise<EventHandlerResult> {
    const result = await recordAudienceMetricFromEvent(event)

    if (result.status === "skipped") {
      return {
        status: "skipped",
        reason: result.reason,
      }
    }

    return {
      status: "completed",
      resultHash: `audience:${event.event_id}`,
    }
  },
}
