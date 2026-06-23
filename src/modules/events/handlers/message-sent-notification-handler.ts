import { createMessageReceivedNotification } from "@/modules/notification/public/create-message-received-notification"
import type { MessageSentEventContract } from "@/modules/message/contracts/message-event-contracts"
import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"

function stableHash(input: unknown): string {
  return JSON.stringify(input)
}

export const messageSentNotificationHandler: EventHandler = {
  handlerName: "MessageSentNotificationConsumer",
  eventTypes: ["message.sent"],

  async handle(event): Promise<EventHandlerResult> {
    await createMessageReceivedNotification(
      event.payload as MessageSentEventContract
    )

    return {
      status: "completed",
      resultHash: stableHash({
        handlerName: "MessageSentNotificationConsumer",
        eventId: event.event_id,
        eventType: event.event_type,
        aggregateId: event.aggregate_id,
      }),
    }
  },
}
