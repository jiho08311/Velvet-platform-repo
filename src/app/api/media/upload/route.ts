import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { createMedia } from "@/modules/media/server/create-media"
import { uploadMedia } from "@/modules/media/server/upload-media"

function getMediaTypeFromMimeType(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return "image" as const
  }

  if (mimeType.startsWith("video/")) {
    return "video" as const
  }

  if (mimeType.startsWith("audio/")) {
    return "audio" as const
  }

  return "file" as const
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const formData = await request.formData()
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File)

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    const uploadedMedia = []

    for (const file of files) {
      const storagePath = await uploadMedia({
        uploaderUserId: user.id,
        file,
        purpose: "message",
      })

      const media = await createMedia({
        ownerUserId: user.id,
        type: getMediaTypeFromMimeType(file.type || ""),
        storagePath,
        mimeType: file.type || undefined,
        sortOrder: 0,
        status: "ready",
      })

      uploadedMedia.push(media)
    }

    return NextResponse.json(
      {
        mediaIds: uploadedMedia.map((media) => media.id),
        media: uploadedMedia,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("media upload route error:", error)

    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    )
  }
}