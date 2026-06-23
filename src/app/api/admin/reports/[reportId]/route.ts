import { NextResponse } from "next/server"
import { getReportById } from "@/modules/report/public/get-report-by-id"
import { requireAdmin } from "@/modules/admin/public/require-admin"

type RouteParams = {
  params: Promise<{
    reportId: string
  }>
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  try {
    await requireAdmin()
    const { reportId } = await params
    const report = await getReportById(reportId)

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { report },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load report"

    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}
