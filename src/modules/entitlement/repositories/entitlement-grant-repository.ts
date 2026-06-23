import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { entitlementInfrastructureError } from "./entitlement-grant-errors"
export {
  issueContentAccessGrant,
  issueContentAccessGrantNoThrow,
  type IssueContentAccessGrantInput,
} from "./content-access-grant-repository"
export {
  issueMessageAccessGrant,
  issueMessageAccessGrantNoThrow,
  type IssueMessageAccessGrantInput,
} from "./message-access-grant-repository"

export type IssueCreatorMembershipGrantInput = {
  viewerUserId: string
  creatorId: string
  subscriptionId: string
  startsAt: string
  expiresAt: string | null
  sourceType?: string
  metadata?: Record<string, unknown>
}

export type RevokeCreatorMembershipGrantInput = {
  viewerUserId: string
  creatorId: string
  subscriptionId?: string | null
  revokedAt: string
  revokeReason: string
}

export async function issueCreatorMembershipGrant({
  viewerUserId,
  creatorId,
  subscriptionId,
  startsAt,
  expiresAt,
  sourceType = "subscription_upsert",
  metadata = {},
}: IssueCreatorMembershipGrantInput): Promise<void> {
  const { error: grantError } = await supabaseAdmin
    .from("entitlement_grants")
    .upsert(
      {
        grant_type: "creator_membership",
        subject_type: "creator",
        subject_id: creatorId,
        viewer_user_id: viewerUserId,
        creator_id: creatorId,
        source_type: sourceType,
        source_id: subscriptionId,
        starts_at: startsAt,
        expires_at: expiresAt,
        revoked_at: null,
        revoke_reason: null,
        metadata,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          "grant_type,subject_type,subject_id,viewer_user_id,source_type,source_id",
      }
    )

  if (grantError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_CREATOR_MEMBERSHIP_GRANT_CREATE_FAILED",
      grantError,
      {
        viewerUserId,
        creatorId,
        subscriptionId,
      }
    )
  }

  const { error: projectionError } = await supabaseAdmin
    .from("entitlement_access_projection")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        subject_type: "creator",
        subject_id: creatorId,
        creator_id: creatorId,
        grant_type: "creator_membership",
        grant_id: null,
        can_access: true,
        starts_at: startsAt,
        expires_at: expiresAt,
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
      "ENTITLEMENT_CREATOR_MEMBERSHIP_PROJECTION_UPSERT_FAILED",
      projectionError,
      {
        viewerUserId,
        creatorId,
        subscriptionId,
      }
    )
  }
}

/**
 * @deprecated Use issueCreatorMembershipGrant in critical paths.
 */
export async function issueCreatorMembershipGrantNoThrow(
  input: IssueCreatorMembershipGrantInput
): Promise<void> {
  await issueCreatorMembershipGrant(input)
}

export async function revokeCreatorMembershipGrant({
  viewerUserId,
  creatorId,
  subscriptionId,
  revokedAt,
  revokeReason,
}: RevokeCreatorMembershipGrantInput): Promise<void> {
  let grantQuery = supabaseAdmin
    .from("entitlement_grants")
    .update({
      revoked_at: revokedAt,
      revoke_reason: revokeReason,
      updated_at: revokedAt,
    })
    .eq("grant_type", "creator_membership")
    .eq("subject_type", "creator")
    .eq("subject_id", creatorId)
    .eq("viewer_user_id", viewerUserId)
    .eq("creator_id", creatorId)
    .is("revoked_at", null)

  if (subscriptionId) {
    grantQuery = grantQuery.eq("source_id", subscriptionId)
  }

  const { error: grantError } = await grantQuery

  if (grantError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_CREATOR_MEMBERSHIP_REVOKE_FAILED",
      grantError,
      {
        viewerUserId,
        creatorId,
        subscriptionId,
      }
    )
  }

  const { error: projectionError } = await supabaseAdmin
    .from("entitlement_access_projection")
    .update({
      can_access: false,
      revoked_at: revokedAt,
      updated_at: revokedAt,
    })
    .eq("viewer_user_id", viewerUserId)
    .eq("subject_type", "creator")
    .eq("subject_id", creatorId)
    .eq("grant_type", "creator_membership")
    .is("revoked_at", null)

  if (projectionError) {
    throw entitlementInfrastructureError(
      "ENTITLEMENT_CREATOR_MEMBERSHIP_PROJECTION_REVOKE_FAILED",
      projectionError,
      {
        viewerUserId,
        creatorId,
        subscriptionId,
      }
    )
  }
}

/**
 * @deprecated Use revokeCreatorMembershipGrant in critical paths.
 */
export async function revokeCreatorMembershipGrantNoThrow(
  input: RevokeCreatorMembershipGrantInput
): Promise<void> {
  await revokeCreatorMembershipGrant(input)
}
