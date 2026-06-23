import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/public/event-handler-registry"
import { updateDashboardSnapshotFromMetricEvent } from "@/modules/analytics/workers/dashboard-snapshot-worker"

export const dashboardSnapshotEventHandler: EventHandler = {
  handlerName: "analytics-dashboard-snapshot-worker",
eventTypes: [
  "RevenueMetricRecorded",
  "AudienceMetricRecorded",
  "ContentMetricRecorded",
  "ModerationMetricRecorded",
],

  async handle(event): Promise<EventHandlerResult> {
    const result = await updateDashboardSnapshotFromMetricEvent(event)

    if (result.status === "skipped") {
      return {
        status: "skipped",
        reason: result.reason,
      }
    }

    return {
      status: "completed",
      resultHash: `dashboard-snapshot:${event.event_id}`,
    }
  },
}
