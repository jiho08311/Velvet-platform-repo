import { NextResponse } from "next/server"
import { getReportById } from "@/modules/report/server/get-report-by-id"

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