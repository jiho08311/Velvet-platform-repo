import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function getStoryReadStateMap(viewerUserId: string) {
  const { data, error } = await supabaseAdmin
    .from("story_read_states")
    .select("creator_id, last_seen_story_id")
    .eq("viewer_user_id", viewerUserId)

  if (error) throw error

  const map = new Map<string, string>()

  for (const row of data ?? []) {
    if (row.last_seen_story_id) {
      map.set(row.creator_id, row.last_seen_story_id)
    }
  }

  return map
}

export async function markStoryReadState(params: {
  viewerUserId: string
  creatorId: string
  lastSeenStoryId: string
}) {
  const { viewerUserId, creatorId, lastSeenStoryId } = params

  const { error } = await supabaseAdmin
    .from("story_read_states")
    .upsert(
      {
        viewer_user_id: viewerUserId,
        creator_id: creatorId,
        last_seen_story_id: lastSeenStoryId,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: "viewer_user_id,creator_id",
      }
    )

  if (error) throw error
}