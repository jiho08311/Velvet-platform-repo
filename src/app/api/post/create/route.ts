import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { getProfileByUserId } from "@/modules/profile/public/get-profile-by-user-id"
import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import { assertValidPpvPrice } from "@/modules/post/public/ppv-price"
import type {
  CreatePostDraftBlock,
  CreatePostUploadedMediaInput,
} from "@/modules/post/types"

type PostStatus = "draft" | "published" | "archived"
type PostVisibility = "public" | "subscribers" | "paid"

function isPostStatus(value: string): value is PostStatus {
  return value === "draft" || value === "published" || value === "archived"
}

function isPostVisibility(value: string): value is PostVisibility {
  return value === "public" || value === "subscribers" || value === "paid"
}

function isUploadedMediaType(
  value: string
): value is CreatePostUploadedMediaInput["type"] {
  return (
    value === "image" ||
    value === "video" ||
    value === "audio" ||
    value === "file"
  )
}

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const formData = await request.formData()

    const textValue = formData.get("text")
    const statusValue = formData.get("status")
    const visibilityValue = formData.get("visibility")
    const priceValue = formData.get("price")

    const text = typeof textValue === "string" ? textValue.trim() : ""

    const status: PostStatus =
      typeof statusValue === "string" && isPostStatus(statusValue)
        ? statusValue
        : "published"

    const visibility: PostVisibility =
      typeof visibilityValue === "string" && isPostVisibility(visibilityValue)
        ? visibilityValue
        : "subscribers"

    const parsedPrice =
      typeof priceValue === "string" && priceValue.trim().length > 0
        ? Number(priceValue)
        : 0

    const rawPrice = Number.isFinite(parsedPrice)
      ? Math.max(0, Math.floor(parsedPrice))
      : 0

    let finalPrice = 0

    if (visibility === "paid") {
      try {
        finalPrice = assertValidPpvPrice(rawPrice)
      } catch {
        return NextResponse.json(
          { error: "Invalid post price" },
          { status: 400 }
        )
      }
    }

    const creator = await getCreatorByUserId(session.userId)

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const profile = await getProfileByUserId(session.userId)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const files: CreatePostUploadedMediaInput[] = formData
      .getAll("files")
      .map((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value)
          } catch {
            return null
          }
        }

        return null
      })
      .filter(
        (
          value
        ): value is CreatePostUploadedMediaInput =>
          !!value &&
          typeof value.path === "string" &&
          typeof value.type === "string" &&
          isUploadedMediaType(value.type) &&
          typeof value.mimeType === "string" &&
          typeof value.size === "number" &&
          typeof value.originalName === "string"
      )


const blocks: CreatePostDraftBlock[] = []

if (text) {
  blocks.push({
    type: "text",
    sortOrder: blocks.length,
    content: text,
  })
}

for (const file of files) {
  blocks.push({
    type: file.type,
    sortOrder: blocks.length,
    media: {
      kind: "uploaded",
      uploaded: file,
    },
    content: null,
  })
}



await createPostWithMediaWorkflow({
  creatorId: creator.id,
  content: text,
  blocks,
  status,
  visibility,
  price: finalPrice,
})

    return NextResponse.json(
      {
        creatorUsername: profile.username,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create post"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
