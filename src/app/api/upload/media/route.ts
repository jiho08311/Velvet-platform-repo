export const runtime = "nodejs"

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || ""

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data" },
      { status: 400 }
    )
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "File is required" },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Placeholder external storage upload (S3/R2 assumed)
  const fileKey = `${crypto.randomUUID()}-${file.name}`

  // In real implementation:
  // await storageClient.putObject({ key: fileKey, body: buffer })

  const fileUrl = `https://storage.example.com/${fileKey}`

  return NextResponse.json({
    url: fileUrl,
    mimeType: file.type,
    size: buffer.length,
  })
}