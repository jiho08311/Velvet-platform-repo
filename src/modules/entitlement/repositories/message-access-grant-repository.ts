import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import { entitlementInfrastructureError } from "./entitlement-grant-errors"

export type IssueMessageAccessGrantInput = {
  viewerUserId: string
  messageId: string
  conversationId: string
  paymentId: string
  grantedAt: string
  sourceType?: string
  metadata?: Record<string, unknown>
}

export async function issueMessageAccessGrant({
  viewerUserId,
  messageId,
  conversationId,
  paymentId,
  grantedAt,
  sourceType = "ppv_message_payment_succeeded",
  metadata = {},
}: IssueMessageAccessGrantInput): Promise<void> {
  const { data: messageGrant, error: messageGrantError } = await supabaseAdmin
    .from("message_access_grants")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        message_id: messageId,
        conversation_id: conversationId,
        payment_id: paymentId,
        granted_at: grantedAt,
        revoked_at: null,
        revoke_reason: null,
        metadata,
      },
      {
        onConflict: "payment_id",
      }
    )
    .select("id")
    .maybeSingle<{ id: string }>()

  if (messageGrantError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_MESSAGE_ACCESS_GRANT_CREATE_FAILED",
      messageGrantError,
      {
        viewerUserId,
        messageId,
        conversationId,
        paymentId,
      }
    )
  }

  const { error: grantError } = await supabaseAdmin
    .from("entitlement_grants")
    .upsert(
      {
        grant_type: "message_access",
        subject_type: "message",
        subject_id: messageId,
        viewer_user_id: viewerUserId,
        creator_id: null,
        source_type: sourceType,
        source_id: paymentId,
        starts_at: grantedAt,
        expires_at: null,
        revoked_at: null,
        revoke_reason: null,
        metadata: {
          ...metadata,
          messageAccessGrantId: messageGrant?.id ?? null,
          conversationId,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          "grant_type,subject_type,subject_id,viewer_user_id,source_type,source_id",
      }
    )

  if (grantError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_MESSAGE_ENTITLEMENT_GRANT_CREATE_FAILED",
      grantError,
      {
        viewerUserId,
        messageId,
        conversationId,
        paymentId,
      }
    )
  }

  const { error: projectionError } = await supabaseAdmin
    .from("entitlement_access_projection")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        subject_type: "message",
        subject_id: messageId,
        creator_id: null,
        grant_type: "message_access",
        grant_id: messageGrant?.id ?? null,
        can_access: true,
        starts_at: grantedAt,
        expires_at: null,
        revoked_at: null,
        decision_version: "entitlement_v1",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "viewer_user_id,subject_type,subject_id,grant_type",
      }
    )

  if (projectionError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_MESSAGE_ACCESS_PROJECTION_UPSERT_FAILED",
      projectionError,
      {
        viewerUserId,
        messageId,
        conversationId,
        paymentId,
      }
    )
  }
}

/**
 * @deprecated Use issueMessageAccessGrant in critical paths.
 */
export async function issueMessageAccessGrantNoThrow(
  input: IssueMessageAccessGrantInput
): Promise<void> {
  await issueMessageAccessGrant(input)
}
