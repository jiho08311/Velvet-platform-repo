import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function insertOperationalMetricEvent(input: {
  metricName: string
  consumerName: string
  metricKind: "counter" | "timing"
  value: number
  durationMs?: number | null
  labels?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin.from("operational_metric_events").insert({
    metric_name: input.metricName,
    consumer_name: input.consumerName,
    metric_kind: input.metricKind,
    value: input.value,
    duration_ms: input.durationMs ?? null,
    labels: input.labels ?? {},
  })

  if (error) {
    throw error
  }
}
