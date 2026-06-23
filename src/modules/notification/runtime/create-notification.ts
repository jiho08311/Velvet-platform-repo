import type { CreateNotificationInput } from "../types"
import { insertCanonicalNotification } from "../repositories/canonical-notification-write-repository"
import { normalizeNotificationData } from "../mappers/notification-read-model-mapper"

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
await insertCanonicalNotification({
  userId: input.userId,
  type: input.type,
  title: input.title,
  body: input.body,
  data: normalizeNotificationData(input.data, input.type),
})
}