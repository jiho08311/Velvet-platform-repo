import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/public/event-handler-registry"
import { recordModerationMetricFromEvent } from "@/modules/analytics/workers/moderation-rollup-worker"

export const moderationRollupEventHandler: EventHandler = {
  handlerName: "analytics-moderation-rollup-worker",
  eventTypes: [
    "TrustSafetyActionIssued",
    "ContentVisibilityChanged",
    "UserTrustStateChanged",
    "ModerationCaseOpened",
    "ModerationCaseReviewed",
    "MediaSafetyStateChanged",
  ],

  async handle(event): Promise<EventHandlerResult> {
    const result = await recordModerationMetricFromEvent(event)

    if (result.status === "skipped") {
      return {
        status: "skipped",
        reason: result.reason,
      }
    }

    return {
      status: "completed",
      resultHash: `moderation:${event.event_id}`,
    }
  },
}
