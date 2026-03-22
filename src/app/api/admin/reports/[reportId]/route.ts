import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getReports } from "@/modules/admin/server/get-reports"

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
    await requireUser()

    const { reportId } = await params
    const reports = await getReports()
    const report = reports.items.find((item) => item.id === reportId)

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