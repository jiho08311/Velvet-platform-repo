import { insertOperationalMetricEvent } from "@/infrastructure/observability/metric-event-repository"

type MetricLabels = Record<string, unknown>

type IncrementMetricInput = {
  name: string
  consumerName: string
  value?: number
  labels?: MetricLabels
}

type TimingMetricInput = {
  name: string
  consumerName: string
  durationMs: number
  labels?: MetricLabels
}

async function recordMetric(input: {
  name: string
  consumerName: string
  kind: "counter" | "timing"
  value: number
  durationMs?: number
  labels?: MetricLabels
}): Promise<void> {
  await insertOperationalMetricEvent({
    metricName: input.name,
    consumerName: input.consumerName,
    metricKind: input.kind,
    value: input.value,
    durationMs: input.durationMs ?? null,
    labels: input.labels,
  })
}

export const metrics = {
  async increment(input: IncrementMetricInput): Promise<void> {
    await recordMetric({
      name: input.name,
      consumerName: input.consumerName,
      kind: "counter",
      value: input.value ?? 1,
      labels: input.labels,
    })
  },

  async timing(input: TimingMetricInput): Promise<void> {
    await recordMetric({
      name: input.name,
      consumerName: input.consumerName,
      kind: "timing",
      value: 1,
      durationMs: input.durationMs,
      labels: input.labels,
    })
  },
}
