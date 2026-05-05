import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function markMediaApprovedForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("media")
    .update({
      status: "ready",
      processing_status: "ready",
      moderation_status: "approved",
      moderation_summary: summary,
      moderation_completed_at: now,
    })
    .eq("id", mediaId)

  if (error) {
    throw error
  }
}

export async function markMediaRejectedForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("media")
    .update({
      status: "failed",
      processing_status: "failed",
      moderation_status: "rejected",
      moderation_summary: summary,
      moderation_completed_at: now,
    })
    .eq("id", mediaId)

  if (error) {
    throw error
  }
}

export async function markMediaNeedsReviewForModeration(
  mediaId: string,
  summary: Record<string, unknown>
) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("media")
    .update({
      status: "failed",
      processing_status: "failed",
      moderation_status: "needs_review",
      moderation_summary: summary,
      moderation_completed_at: now,
    })
    .eq("id", mediaId)

  if (error) {
    throw error
  }
}

export async function findMediaModerationStatusesByPostId(
  postId: string
): Promise<Array<string | null>> {
  const { data, error } = await supabaseAdmin
    .from("media")
    .select("moderation_status")
    .eq("post_id", postId)
    .returns<Array<{ moderation_status: string | null }>>()

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => item.moderation_status)
}