export type MessagingObservabilitySurface =
  | "conversation_entitlement_reconstruction"
  | "message_send_entitlement_visibility"
  | "message_attachment_visibility"
  | "message_media_capability_visibility"
  | "ppv_message_unlock_visibility"

export type MessagingSafeObservationField =
  | "conversationId"
  | "messageId"
  | "senderId"
  | "viewerUserId"
  | "otherUserId"
  | "mediaId"
  | "storagePathPresent"
  | "subscriptionId"
  | "creatorId"
  | "paymentId"
  | "decisionKind"
  | "decisionOutput"

export type MessagingForbiddenObservationField =
  | "rawSignedUrl"
  | "signedUrlToken"
  | "storageServiceRoleSecret"
  | "rawStoragePathWhenNotNeeded"

export type MessagingObservabilityTopologyItem = Readonly<{
  observabilityId: string
  surface: MessagingObservabilitySurface
  safeFields: readonly MessagingSafeObservationField[]
  forbiddenFields: readonly MessagingForbiddenObservationField[]
  authorityMode: "shadow_only"
  enforcementMode: "none"
  insertionMode: "not_inserted"
  rollbackMode: "remove_messaging_observability_metadata"
  notes: string
}>

function createMessagingObservabilityTopologyItem(
  item: MessagingObservabilityTopologyItem
): MessagingObservabilityTopologyItem {
  return Object.freeze({
    ...item,
    safeFields: Object.freeze([...item.safeFields]),
    forbiddenFields: Object.freeze([...item.forbiddenFields]),
    authorityMode: "shadow_only",
    enforcementMode: "none",
    insertionMode: "not_inserted",
    rollbackMode: "remove_messaging_observability_metadata",
  })
}

export const messagingObservabilityTopology = Object.freeze([
  createMessagingObservabilityTopologyItem({
    observabilityId: "messaging.observability.conversation_entitlement_reconstruction.v1",
    surface: "conversation_entitlement_reconstruction",
    safeFields: ["conversationId", "viewerUserId", "otherUserId", "decisionKind", "decisionOutput"],
    forbiddenFields: ["rawSignedUrl", "signedUrlToken", "storageServiceRoleSecret"],
    authorityMode: "shadow_only",
    enforcementMode: "none",
    insertionMode: "not_inserted",
    rollbackMode: "remove_messaging_observability_metadata",
    notes:
      "Defines future safe observation fields for conversation membership reconstruction. No runtime observer is inserted in this brief.",
  }),
  createMessagingObservabilityTopologyItem({
    observabilityId: "messaging.observability.message_send_entitlement_visibility.v1",
    surface: "message_send_entitlement_visibility",
    safeFields: [
      "conversationId",
      "senderId",
      "otherUserId",
      "subscriptionId",
      "creatorId",
      "decisionKind",
      "decisionOutput",
    ],
    forbiddenFields: ["rawSignedUrl", "signedUrlToken", "storageServiceRoleSecret"],
    authorityMode: "shadow_only",
    enforcementMode: "none",
    insertionMode: "not_inserted",
    rollbackMode: "remove_messaging_observability_metadata",
    notes:
      "Defines future message send subscription gate visibility fields. It must never change assertCanSendMessage behavior.",
  }),
  createMessagingObservabilityTopologyItem({
    observabilityId: "messaging.observability.message_attachment_visibility.v1",
    surface: "message_attachment_visibility",
    safeFields: ["conversationId", "senderId", "otherUserId", "mediaId", "decisionKind", "decisionOutput"],
    forbiddenFields: ["rawSignedUrl", "signedUrlToken", "storageServiceRoleSecret"],
    authorityMode: "shadow_only",
    enforcementMode: "none",
    insertionMode: "not_inserted",
    rollbackMode: "remove_messaging_observability_metadata",
    notes:
      "Defines future attachment eligibility visibility fields without observing file contents or storage secrets.",
  }),
  createMessagingObservabilityTopologyItem({
    observabilityId: "messaging.observability.message_media_capability_visibility.v1",
    surface: "message_media_capability_visibility",
    safeFields: [
      "messageId",
      "viewerUserId",
      "senderId",
      "mediaId",
      "storagePathPresent",
      "decisionKind",
      "decisionOutput",
    ],
    forbiddenFields: [
      "rawSignedUrl",
      "signedUrlToken",
      "storageServiceRoleSecret",
      "rawStoragePathWhenNotNeeded",
    ],
    authorityMode: "shadow_only",
    enforcementMode: "none",
    insertionMode: "not_inserted",
    rollbackMode: "remove_messaging_observability_metadata",
    notes:
      "Signed URL observability must be presence/classification only. Raw signed URL values and tokens are forbidden.",
  }),
  createMessagingObservabilityTopologyItem({
    observabilityId: "messaging.observability.ppv_message_unlock_visibility.v1",
    surface: "ppv_message_unlock_visibility",
    safeFields: ["messageId", "paymentId", "creatorId", "decisionKind", "decisionOutput"],
    forbiddenFields: ["rawSignedUrl", "signedUrlToken", "storageServiceRoleSecret"],
    authorityMode: "shadow_only",
    enforcementMode: "none",
    insertionMode: "not_inserted",
    rollbackMode: "remove_messaging_observability_metadata",
    notes:
      "Defines future PPV message unlock correlation visibility only. No payment runtime or media authority changes are introduced.",
  }),
] satisfies readonly MessagingObservabilityTopologyItem[])
