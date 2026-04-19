import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { buildPostModerationTransitionPayload } from "./post-moderation-transition-policy"

type UpdatePostStatusInput =
  | {
      postId: string
      outcome: "approved"
      publishIntent: "published" | "scheduled"
      publishedAt?: string | null
      clearRejectionReason?: boolean
    }
  | {
      postId: string
      outcome: "rejected"
      rejectionReason?: string | null
    }
  | {
      postId: string
      outcome: "needs_review"
      clearRejectionReason?: boolean
    }
  | {
      postId: string
      outcome: "pending"
      clearRejectionReason?: boolean
    }

type CurrentPostStatusRow = {
  status: "draft" | "scheduled" | "published" | "archived" | null
}

async function getCurrentPostStatus(postId: string) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("status")
    .eq("id", postId)
    .maybeSingle<CurrentPostStatusRow>()

  if (error) {
    throw error
  }

  return data?.status ?? null
}

export async function updatePostStatus(input: UpdatePostStatusInput) {
  const resolvedPostId = input.postId.trim()

  if (!resolvedPostId) {
    throw new Error("postId is required")
  }

  if (input.outcome === "approved") {
    const currentStatus = await getCurrentPostStatus(resolvedPostId)

    if (currentStatus === "archived") {
      return
    }
  }

  const updatePayload =
    input.outcome === "approved"
      ? buildPostModerationTransitionPayload({
          outcome: "approved",
          publishIntent: input.publishIntent,
          publishedAt: input.publishedAt ?? null,
          clearRejectionReason: input.clearRejectionReason ?? true,
        })
      : input.outcome === "rejected"
        ? buildPostModerationTransitionPayload({
            outcome: "rejected",
            rejectionReason: input.rejectionReason ?? null,
          })
        : input.outcome === "needs_review"
          ? buildPostModerationTransitionPayload({
              outcome: "needs_review",
              clearRejectionReason: input.clearRejectionReason ?? true,
            })
          : buildPostModerationTransitionPayload({
              outcome: "pending",
              clearRejectionReason: input.clearRejectionReason ?? true,
            })

  const { error } = await supabaseAdmin
    .from("posts")
    .update(updatePayload)
    .eq("id", resolvedPostId)

  if (error) {
    throw error
  }
}