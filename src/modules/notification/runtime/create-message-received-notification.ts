import type { MessageSentEventContract as MessageSentEvent } from "@/modules/message/contracts/message-event-contracts"

import { createNotification } from "./create-notification"
import { createMessageReceivedNotificationInput } from "@/modules/notification/factories/create-notification-inputs"

export async function createMessageReceivedNotification(
  event: MessageSentEvent
): Promise<void> {
  await createNotification(createMessageReceivedNotificationInput(event))
}
