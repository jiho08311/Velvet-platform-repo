import OpenAI from "openai"
import {
  downloadMessageModerationMedia,
  getModerationMediaRowsByIds,
} from "@/modules/media/public/download-message-moderation-media"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function assertMessageTextSafety(text: string) {
  const trimmed = text.trim()

  if (!trimmed) return

  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: trimmed,
  })

  const result = response.results?.[0]

  if (!result) {
    throw new Error("Failed to moderate text")
  }

  if (result.flagged) {
    throw new Error("TEXT_BLOCKED")
  }
}

export async function assertMessageImageSafety(mediaIds: string[]) {
  if (mediaIds.length === 0) return

  const mediaRows = await getModerationMediaRowsByIds(mediaIds)

  for (const media of mediaRows) {
    if (!media.mime_type?.startsWith("image/")) continue

    const arrayBuffer = await downloadMessageModerationMedia({
      storagePath: media.storage_path,
      missingDataErrorMessage: "Failed to load image for moderation",
    })
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${media.mime_type};base64,${base64}`

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        },
      ],
    })

    const result = response.results?.[0]

    if (!result) {
      throw new Error("Failed to moderate image")
    }

    if (result.flagged) {
      throw new Error("IMAGE_BLOCKED")
    }
  }
}

export async function assertMessageSafety(input: {
  content: string
  mediaIds: string[]
}) {
  await assertMessageTextSafety(input.content)
  await assertMessageImageSafety(input.mediaIds)
}
