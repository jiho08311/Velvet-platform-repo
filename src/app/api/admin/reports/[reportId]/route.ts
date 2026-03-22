import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type RouteParams = {
  params: {
    reportId: string
  }
}

export async function GET(
  _request: Request,
  { params }: RouteParams
) {
  try {
    await requireUser()

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", params.reportId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { report: data },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load report"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}