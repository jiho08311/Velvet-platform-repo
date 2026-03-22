import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { resolveReport } from "@/modules/report/server/resolve-report"

type RouteParams = {
  params: {
    reportId: string
  }
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    await requireUser()

    const result = await resolveReport({
      reportId: params.reportId,
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