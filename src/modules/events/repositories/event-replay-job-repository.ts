import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type EventReplayJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export type EventReplayJobRow = {
  replay_job_id: string
  target_handler: string
  event_type: string | null
  aggregate_type: string | null
  from_occurred_at: string | null
  to_occurred_at: string | null
  cursor_event_id: string | null
  status: EventReplayJobStatus
  dry_run: boolean
  requested_by: string | null
  reason: string | null
}

export type ReplayDomainEventRow = {
  event_id: string
  event_type: string
  event_version: number
  aggregate_type: string
  aggregate_id: string
  payload: Record<string, unknown>
  metadata: Record<string, unknown>
}

export async function createEventReplayJob(input: {
  targetHandler: string
  eventType?: string | null
  aggregateType?: string | null
  fromOccurredAt?: string | null
  toOccurredAt?: string | null
  dryRun?: boolean
  requestedBy?: string | null
  reason?: string | null
}): Promise<{ replayJobId: string }> {
  const { data, error } = await supabaseAdmin
    .from("event_replay_jobs")
    .insert({
      target_handler: input.targetHandler,
      event_type: input.eventType ?? null,
      aggregate_type: input.aggregateType ?? null,
      from_occurred_at: input.fromOccurredAt ?? null,
      to_occurred_at: input.toOccurredAt ?? null,
      dry_run: input.dryRun ?? true,
      requested_by: input.requestedBy ?? null,
      reason: input.reason ?? null,
      status: "pending",
    })
    .select("replay_job_id")
    .single<{ replay_job_id: string }>()

  if (error) throw error

  return {
    replayJobId: data.replay_job_id,
  }
}

export async function findEventReplayJob(
  replayJobId: string,
): Promise<EventReplayJobRow | null> {
  const { data, error } = await supabaseAdmin
    .from("event_replay_jobs")
    .select(
      "replay_job_id, target_handler, event_type, aggregate_type, from_occurred_at, to_occurred_at, cursor_event_id, status, dry_run, requested_by, reason"
    )
    .eq("replay_job_id", replayJobId)
    .maybeSingle<EventReplayJobRow>()

  if (error) throw error

  return data
}

export async function markReplayJobRunning(replayJobId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("event_replay_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("replay_job_id", replayJobId)

  if (error) throw error
}

export async function updateReplayJobCursor(input: {
  replayJobId: string
  cursorEventId: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("event_replay_jobs")
    .update({
      cursor_event_id: input.cursorEventId,
      updated_at: new Date().toISOString(),
    })
    .eq("replay_job_id", input.replayJobId)

  if (error) throw error
}

export async function markReplayJobCompleted(replayJobId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("event_replay_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("replay_job_id", replayJobId)

  if (error) throw error
}

export async function markReplayJobFailed(input: {
  replayJobId: string
  errorMessage: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("event_replay_jobs")
    .update({
      status: "failed",
      last_error: input.errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("replay_job_id", input.replayJobId)

  if (error) throw error
}

export async function listReplayDomainEvents(input: {
  eventType?: string | null
  aggregateType?: string | null
  fromOccurredAt?: string | null
  toOccurredAt?: string | null
  afterEventId?: string | null
  limit?: number
}): Promise<ReplayDomainEventRow[]> {
  let query = supabaseAdmin
    .from("domain_events")
    .select(
      "event_id, event_type, event_version, aggregate_type, aggregate_id, payload, metadata"
    )
    .order("occurred_at", { ascending: true })
    .order("event_id", { ascending: true })
    .limit(input.limit ?? 100)

  if (input.eventType) {
    query = query.eq("event_type", input.eventType)
  }

  if (input.aggregateType) {
    query = query.eq("aggregate_type", input.aggregateType)
  }

  if (input.fromOccurredAt) {
    query = query.gte("occurred_at", input.fromOccurredAt)
  }

  if (input.toOccurredAt) {
    query = query.lte("occurred_at", input.toOccurredAt)
  }

  if (input.afterEventId) {
    query = query.neq("event_id", input.afterEventId)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as ReplayDomainEventRow[]
}
