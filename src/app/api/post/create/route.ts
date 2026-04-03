import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getProfileByUserId } from "@/modules/profile/server/get-profile-by-user-id"
import { createPostWithMediaWorkflow } from "@/workflows/create-post-with-media-workflow"
import { assertValidPpvPrice } from "@/modules/post/lib/ppv-price"

type PostStatus = "draft" | "published" | "archived"
type PostVisibility = "public" | "subscribers" | "paid"

function isPostStatus(value: string): value is PostStatus {
  return value === "draft" || value === "published" || value === "archived"
}

function isPostVisibility(value: string): value is PostVisibility {
  return value === "public" || value === "subscribers" || value === "paid"
}

export async function POST(request: Request) {
  try {
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

    const user = await requireUser()
    const creator = await getCreatorByUserId(user.id)

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const profile = await getProfileByUserId(user.id)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0)

    await createPostWithMediaWorkflow({
      creatorId: creator.id,
      content: text,
      files,
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