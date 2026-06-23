export type ClaimedOutboxEvent = {
  outbox_id: string
  event_id: string
  event_type: string
  event_version: number
  aggregate_type: string
  aggregate_id: string
  payload: Record<string, unknown>
  metadata: Record<string, unknown>
  attempts: number
}
