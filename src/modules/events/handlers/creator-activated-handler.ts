import { rebuildCreatorPublicCardByUserId } from "@/modules/creator/public/rebuild-creator-public-cards"
import { rebuildCreatorSearchDocument } from "@/modules/search/public/rebuild-search-documents"
import type {
  EventHandler,
  EventHandlerResult,
} from "@/modules/events/runtime/event-handler-registry"

type CreatorActivatedPayload = {
  creatorId?: string | null
  userId?: string | null
  activationVersion?: number | null
}

function stableHash(input: unknown): string {
  return JSON.stringify(input)
}

export const creatorActivatedHandler: EventHandler = {
  handlerName: "CreatorActivatedProjectionConsumer",

  eventTypes: ["CreatorActivated"],

  async handle(event): Promise<EventHandlerResult> {
    const payload = event.payload as CreatorActivatedPayload

    if (!payload.creatorId || !payload.userId) {
      return {
        status: "skipped",
        reason: "missing_creator_or_user_id",
      }
    }

    const publicCardResult = await rebuildCreatorPublicCardByUserId(payload.userId)
    const searchResult = await rebuildCreatorSearchDocument({
      creatorId: payload.creatorId,
    })

    return {
      status:
        publicCardResult.status === "completed" ||
        searchResult.status === "completed"
          ? "completed"
          : "skipped",
      reason:
        publicCardResult.status === "skipped" && searchResult.status === "skipped"
          ? `${publicCardResult.reason}:${searchResult.reason}`
          : undefined,
      resultHash: stableHash({
        handlerName: "CreatorActivatedProjectionConsumer",
        eventId: event.event_id,
        eventType: event.event_type,
        creatorId: payload.creatorId,
        userId: payload.userId,
        activationVersion: payload.activationVersion ?? null,
        publicCardResult,
        searchResult,
      }),
    }
  },
}