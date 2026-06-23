import type { ClaimedOutboxEvent } from "@/modules/events/contracts/claimed-outbox-event"

export type EventHandlerResult = {
  status: "completed" | "skipped"
  resultHash?: string | null
  reason?: string
}

export type EventHandler = {
  handlerName: string
  eventTypes: string[]
  handle(event: ClaimedOutboxEvent): Promise<EventHandlerResult>
}

const handlers: EventHandler[] = []

export function registerEventHandler(handler: EventHandler): void {
  handlers.push(handler)
}

export function getHandlersForEvent(eventType: string): EventHandler[] {
  return handlers.filter((handler) => handler.eventTypes.includes(eventType))
}
