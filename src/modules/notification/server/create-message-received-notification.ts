import type { MessageSentEvent } from "@/modules/message/types"

import { createNotification } from "./create-notification"
import { createMessageReceivedNotificationInput } from "./create-notification-inputs"

export async function createMessageReceivedNotification(
  event: MessageSentEvent
): Promise<void> {
  await createNotification(createMessageReceivedNotificationInput(event))
}
