import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/modules/admin/server/require-admin"
import { resolveReport } from "@/modules/report/server/resolve-report"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    await requireAdmin()

    const { reportId } = await context.params

    const result = await resolveReport({
      reportId,
    })

    return NextResponse.json(
      { report: result },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve report"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}