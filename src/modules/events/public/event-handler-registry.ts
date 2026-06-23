import {
  getHandlersForEvent as getHandlersForEventRuntime,
  registerEventHandler as registerEventHandlerRuntime,
  type EventHandler,
  type EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"

export const PUBLIC_CONTRACT = true

export type { EventHandler, EventHandlerResult }

export function registerEventHandler(handler: EventHandler): void {
  registerEventHandlerRuntime(handler)
}

export function getHandlersForEvent(eventType: string): EventHandler[] {
  return getHandlersForEventRuntime(eventType)
}
