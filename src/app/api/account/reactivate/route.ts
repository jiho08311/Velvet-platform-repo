import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function POST(request: Request) {
  const user = await requireUser()

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      is_deactivated: false,
    })
    .eq("id", user.id)

  if (profileError) {
    throw profileError
  }

  const { error: creatorError } = await supabaseAdmin
    .from("creators")
    .update({
      status: "active",
    })
    .eq("user_id", user.id)

  if (creatorError) {
    throw creatorError
  }

  return NextResponse.redirect(new URL("/settings", request.url), {
    status: 303,
  })
}