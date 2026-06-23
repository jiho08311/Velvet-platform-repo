import { isCreatorOwner } from "@/modules/creator/public/creator-identity"
import { findActiveEntitlementProjection } from "@/modules/entitlement/repositories/entitlement-access-read-repository"

import { deny, toGrantDecision, toOpenDecision } from "./evaluate-access-decision"
import type {
  EntitlementAccessSubject,
  EvaluateAccessDecision,
  EvaluateAccessInput,
  EvaluateAccessSurface,
} from "./evaluate-access-contract"

export type {
  EntitlementAccessSubject,
  EvaluateAccessDecision,
  EvaluateAccessInput,
  EvaluateAccessSurface,
} from "./evaluate-access-contract"

export async function evaluateAccessUseCase(
  input: EvaluateAccessInput
): Promise<{ decision: EvaluateAccessDecision }> {
  const viewerUserId =
    typeof input.viewerUserId === "string" && input.viewerUserId.trim().length > 0
      ? input.viewerUserId.trim()
      : null

  const subject = input.subject

  if (subject.type === "creator") {
    if (!viewerUserId) {
      return {
        decision: deny({
          subject,
          lockReason: "unauthenticated",
          reason: "unauthenticated",
        }),
      }
    }

    const projection = await findActiveEntitlementProjection({
      viewerUserId,
      subjectType: "creator",
      subjectId: subject.creatorId,
      grantTypes: ["creator_membership"],
    })

    if (projection) {
      return {
        decision: toGrantDecision({
          subject,
          projection,
          source: "creator_membership_grant",
          reason: "active_creator_membership",
        }),
      }
    }

    return {
      decision: deny({
        subject,
        lockReason: "subscription",
        reason: "not_subscribed",
      }),
    }
  }

  if (subject.type === "post") {
    const isOwner = isCreatorOwner({
      viewerUserId,
      creatorUserId: subject.creatorUserId,
    })

    if (isOwner) {
      return {
        decision: toOpenDecision({
          subject,
          source: "owner",
          reason: "owner",
        }),
      }
    }

    if (subject.visibility === "public") {
      return {
        decision: toOpenDecision({
          subject,
          source: "public",
          reason: "public",
        }),
      }
    }

    if (!viewerUserId) {
      return {
        decision: deny({
          subject,
          lockReason: "unauthenticated",
          reason: "unauthenticated",
        }),
      }
    }

    if (subject.visibility === "subscribers") {
      const projection = await findActiveEntitlementProjection({
        viewerUserId,
        subjectType: "creator",
        subjectId: subject.creatorId,
        grantTypes: ["creator_membership"],
      })

      if (projection) {
        return {
          decision: toGrantDecision({
            subject,
            projection,
            source: "creator_membership_grant",
            reason: "active_creator_membership",
          }),
        }
      }

      return {
        decision: deny({
          subject,
          lockReason: "subscription",
          reason: "not_subscribed",
        }),
      }
    }

    if (subject.visibility === "paid") {
      const projection = await findActiveEntitlementProjection({
        viewerUserId,
        subjectType: "post",
        subjectId: subject.postId,
        grantTypes: ["content_access"],
      })

      if (projection) {
        return {
          decision: toGrantDecision({
            subject,
            projection,
            source: "content_access_grant",
            reason: "active_content_access",
          }),
        }
      }

      return {
        decision: deny({
          subject,
          lockReason: "purchase",
          reason: "not_purchased",
        }),
      }
    }
  }

  if (subject.type === "message") {
    if (!viewerUserId) {
      return {
        decision: deny({
          subject,
          lockReason: "unauthenticated",
          reason: "unauthenticated",
        }),
      }
    }

    if (subject.viewerIsConversationParticipant === false) {
      return {
        decision: deny({
          subject,
          lockReason: "not_participant",
          reason: "not_participant",
        }),
      }
    }

    if (!subject.isPaid) {
      return {
        decision: toOpenDecision({
          subject,
          source: "public",
          reason: "public",
        }),
      }
    }

    const projection = await findActiveEntitlementProjection({
      viewerUserId,
      subjectType: "message",
      subjectId: subject.messageId,
      grantTypes: ["message_access"],
    })

    if (projection) {
      return {
        decision: toGrantDecision({
          subject,
          projection,
          source: "message_access_grant",
          reason: "active_message_access",
        }),
      }
    }

    return {
      decision: deny({
        subject,
        lockReason: "message_purchase",
        reason: "message_not_purchased",
      }),
    }
  }

  return {
    decision: deny({
      subject,
      lockReason: "not_found",
      reason: "unsupported",
    }),
  }
}
