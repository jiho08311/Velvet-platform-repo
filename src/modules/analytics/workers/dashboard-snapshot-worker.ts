import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"
import {
  rebuildCreatorDashboardSnapshotFromMetricRollups,
  rebuildDashboardSnapshotsFromMetricRollups,
} from "@/modules/analytics/rebuild/rebuild-dashboard-snapshots"

type DashboardSnapshotSourcePayload = {
  creatorId?: string | null
}

function readCreatorId(event: ClaimedOutboxEvent): string | null {
  const payload = event.payload as DashboardSnapshotSourcePayload

  return typeof payload.creatorId === "string" && payload.creatorId.length > 0
    ? payload.creatorId
    : null
}

function isDashboardSnapshotSourceEvent(eventType: string) {
  return (
    eventType === "RevenueMetricRecorded" ||
    eventType === "AudienceMetricRecorded" ||
    eventType === "ContentMetricRecorded" ||
    eventType === "ModerationMetricRecorded"
  )
}

export async function updateDashboardSnapshotFromMetricEvent(
  event: ClaimedOutboxEvent
): Promise<{
  status: "updated" | "skipped"
  reason?: string
}> {
  if (!isDashboardSnapshotSourceEvent(event.event_type)) {
    return {
      status: "skipped",
      reason: `not_snapshot_source_event:${event.event_type}`,
    }
  }

  if (event.event_type === "ModerationMetricRecorded") {
    await rebuildDashboardSnapshotsFromMetricRollups()
    return {
      status: "updated",
    }
  }

  const creatorId = readCreatorId(event)

  if (!creatorId) {
    return {
      status: "skipped",
      reason: "missing_creator_id",
    }
  }

  await rebuildCreatorDashboardSnapshotFromMetricRollups({
    creatorId,
  })

  return {
    status: "updated",
  }
}
