import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { resolveReport } from "@/modules/report/server/resolve-report"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ reportId: string }> }
) {
  try {
    await requireUser()

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