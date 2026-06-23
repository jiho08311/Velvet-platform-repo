import type { EventHandler } from "@/modules/events/runtime/event-handler-registry"

export const failingSmokeHandler: EventHandler = {
  handlerName: "FailingSmokeConsumer",

  eventTypes: ["ProjectionRebuildRequested"],

  async handle(): Promise<never> {
    throw new Error("intentional_phase_5_dead_letter_smoke_failure")
  },
}
