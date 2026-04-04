import { NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : ""
    const username =
      typeof body.username === "string" ? body.username.trim().toLowerCase() : ""
    const birthDate =
      typeof body.birthDate === "string" ? body.birthDate.trim() : ""

    if (!displayName || !username || !birthDate) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      )
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name: displayName,
        username,
        birth_date: birthDate,
        is_adult_verified: true,
        adult_verified_at: new Date().toISOString(),
        adult_verification_method: "self_reported",
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    )
  }
}