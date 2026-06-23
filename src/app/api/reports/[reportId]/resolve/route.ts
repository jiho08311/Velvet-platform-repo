import { NextResponse } from "next/server"
import { resolveReportCase } from "@/modules/governance/public/report-governance-contract"
import { requireAdmin } from "@/modules/admin/public/require-admin"

type RouteParams = {
  params: Promise<{
    reportId: string
  }>
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin()
    const { reportId } = await params

    const result = await resolveReportCase({
      reportCaseKey: reportId,
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
