import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"

function stableHash(input: unknown): string {
  return JSON.stringify(input)
}

export const notificationShadowHandler: EventHandler = {
  handlerName: "NotificationShadowConsumer",

  eventTypes: [
    "PaymentConfirmed",
    "PostLiked",
    "CommentCreated",
    "CommentLiked",
    "SubscriptionActivated",
    "SubscriptionCancelled",
  ],

  async handle(event): Promise<EventHandlerResult> {
    return {
      status: "completed",
      resultHash: stableHash({
        mode: "shadow",
        handlerName: "NotificationShadowConsumer",
        eventId: event.event_id,
        eventType: event.event_type,
        aggregateType: event.aggregate_type,
        aggregateId: event.aggregate_id,
        payload: event.payload,
      }),
    }
  },
}
