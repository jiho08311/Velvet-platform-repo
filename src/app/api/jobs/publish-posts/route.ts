import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from("posts")
    .update({
      status: "published",
      visibility_status: "published",
      moderation_completed_at: now,
      updated_at: now,
    })
    .eq("visibility_status", "draft")
    .eq("moderation_status", "approved")
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .is("deleted_at", null)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}