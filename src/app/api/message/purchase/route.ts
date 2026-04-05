import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "This feature is currently unavailable" },
    { status: 403 }
  )
}