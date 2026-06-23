import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"
import {
  findEventReplayJob,
  listReplayDomainEvents,
  markReplayJobCompleted,
  markReplayJobFailed,
  markReplayJobRunning,
  updateReplayJobCursor,
} from "@/modules/events/repositories/event-replay-job-repository"
import { getHandlersForEvent } from "./event-handler-registry"

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function toReplayEvent(row: {
  event_id: string
  event_type: string
  event_version: number
  aggregate_type: string
  aggregate_id: string
  payload: Record<string, unknown>
  metadata: Record<string, unknown>
}): ClaimedOutboxEvent {
  return {
    outbox_id: `replay:${row.event_id}`,
    event_id: row.event_id,
    event_type: row.event_type,
    event_version: row.event_version,
    aggregate_type: row.aggregate_type,
    aggregate_id: row.aggregate_id,
    payload: row.payload,
    metadata: row.metadata,
    attempts: 0,
  }
}

export async function runEventReplayJob(input: {
  replayJobId: string
  batchSize?: number
}): Promise<{
  replayJobId: string
  dryRun: boolean
  scanned: number
  handled: number
  skipped: number
}> {
  const job = await findEventReplayJob(input.replayJobId)

  if (!job) {
    throw new Error("REPLAY_JOB_NOT_FOUND")
  }

  if (job.status !== "pending" && job.status !== "running") {
    return {
      replayJobId: job.replay_job_id,
      dryRun: job.dry_run,
      scanned: 0,
      handled: 0,
      skipped: 0,
    }
  }

  await markReplayJobRunning(job.replay_job_id)

  const summary = {
    replayJobId: job.replay_job_id,
    dryRun: job.dry_run,
    scanned: 0,
    handled: 0,
    skipped: 0,
  }

  try {
    const events = await listReplayDomainEvents({
      eventType: job.event_type,
      aggregateType: job.aggregate_type,
      fromOccurredAt: job.from_occurred_at,
      toOccurredAt: job.to_occurred_at,
      afterEventId: job.cursor_event_id,
      limit: input.batchSize ?? 100,
    })

    summary.scanned = events.length

    for (const row of events) {
      const replayEvent = toReplayEvent(row)

      const handlers = getHandlersForEvent(replayEvent.event_type).filter(
        (handler) => handler.handlerName === job.target_handler,
      )

      if (handlers.length === 0) {
        summary.skipped += 1
        await updateReplayJobCursor({
          replayJobId: job.replay_job_id,
          cursorEventId: row.event_id,
        })
        continue
      }

      for (const handler of handlers) {
        if (!job.dry_run) {
          await handler.handle(replayEvent)
        }
        summary.handled += 1
      }

      await updateReplayJobCursor({
        replayJobId: job.replay_job_id,
        cursorEventId: row.event_id,
      })
    }

    await markReplayJobCompleted(job.replay_job_id)

    return summary
  } catch (error) {
    await markReplayJobFailed({
      replayJobId: job.replay_job_id,
      errorMessage: errorMessage(error),
    })

    throw error
  }
}
