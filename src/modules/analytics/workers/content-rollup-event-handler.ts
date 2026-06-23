import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/public/event-handler-registry"
import { recordContentMetricFromEvent } from "@/modules/analytics/workers/content-rollup-worker"

export const contentRollupEventHandler: EventHandler = {
  handlerName: "analytics-content-rollup-worker",
  eventTypes: [
    "PostPublished",
    "PostLiked",
    "CommentCreated",
    "PostViewed",
  ],

  async handle(event): Promise<EventHandlerResult> {
    const result = await recordContentMetricFromEvent(event)

    if (result.status === "skipped") {
      return {
        status: "skipped",
        reason: result.reason,
      }
    }

    return {
      status: "completed",
      resultHash: `content:${event.event_id}`,
    }
  },
}
