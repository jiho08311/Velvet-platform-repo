import { NextResponse } from "next/server"

import {
  executeScheduledPostPublicationRuntime,
} from "@/modules/post/public/execute-scheduled-post-publication"
import { requireCronSecret } from "@/shared/security/route-guards"

export async function GET(request: Request) {
  try {
    requireCronSecret(request)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await executeScheduledPostPublicationRuntime()

  return NextResponse.json({ ok: true })
}
