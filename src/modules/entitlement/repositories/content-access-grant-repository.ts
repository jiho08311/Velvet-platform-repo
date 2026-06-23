import { supabaseAdmin } from "@/infrastructure/supabase/admin"

import { entitlementInfrastructureError } from "./entitlement-grant-errors"

export type IssueContentAccessGrantInput = {
  viewerUserId: string
  creatorId: string
  postId: string
  paymentId: string
  grantedAt: string
  sourceType?: string
  metadata?: Record<string, unknown>
}

export async function issueContentAccessGrant({
  viewerUserId,
  creatorId,
  postId,
  paymentId,
  grantedAt,
  sourceType = "ppv_post_payment_succeeded",
  metadata = {},
}: IssueContentAccessGrantInput): Promise<void> {
  const { data: contentGrant, error: contentGrantError } = await supabaseAdmin
    .from("content_access_grants")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        post_id: postId,
        creator_id: creatorId,
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

  if (contentGrantError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_CONTENT_ACCESS_GRANT_CREATE_FAILED",
      contentGrantError,
      {
        viewerUserId,
        creatorId,
        postId,
        paymentId,
      }
    )
  }

  const { error: grantError } = await supabaseAdmin
    .from("entitlement_grants")
    .upsert(
      {
        grant_type: "content_access",
        subject_type: "post",
        subject_id: postId,
        viewer_user_id: viewerUserId,
        creator_id: creatorId,
        source_type: sourceType,
        source_id: paymentId,
        starts_at: grantedAt,
        expires_at: null,
        revoked_at: null,
        revoke_reason: null,
        metadata: {
          ...metadata,
          contentAccessGrantId: contentGrant?.id ?? null,
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
      "ENTITLEMENT_CONTENT_ENTITLEMENT_GRANT_CREATE_FAILED",
      grantError,
      {
        viewerUserId,
        creatorId,
        postId,
        paymentId,
      }
    )
  }

  const { error: projectionError } = await supabaseAdmin
    .from("entitlement_access_projection")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        subject_type: "post",
        subject_id: postId,
        creator_id: creatorId,
        grant_type: "content_access",
        grant_id: contentGrant?.id ?? null,
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
      "ENTITLEMENT_CONTENT_ACCESS_PROJECTION_UPSERT_FAILED",
      projectionError,
      {
        viewerUserId,
        creatorId,
        postId,
        paymentId,
      }
    )
  }
}

/**
 * @deprecated Use issueContentAccessGrant in critical paths.
 */
export async function issueContentAccessGrantNoThrow(
  input: IssueContentAccessGrantInput
): Promise<void> {
  await issueContentAccessGrant(input)
}
