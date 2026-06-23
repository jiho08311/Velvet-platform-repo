import { createReadStream, promises as fs } from "fs"
import OpenAI from "openai"

import type { ModerationResultShape } from "@/modules/moderation/contracts/video-moderation-runtime-contract"
import {
  toBooleanRecord,
  toNumberRecord,
} from "@/modules/moderation/runtime/video-moderation-result-mappers"
import { logger } from "@/shared/observability/structured-logger"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function moderateVideoFrameFile(
  framePath: string
): Promise<ModerationResultShape> {
  logger.info({
    event: "video_moderation.image_moderation_started",
    context: { framePath },
  })

  const buffer = await fs.readFile(framePath)
  const base64 = buffer.toString("base64")

  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: [
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`,
        },
      },
    ],
  })

  const result = response.results?.[0]

  if (!result) {
    throw new Error("Failed to moderate video frame")
  }

  logger.info({
    event: "video_moderation.image_moderation_completed",
    context: {
      framePath,
      flagged: result.flagged,
    },
  })

  return {
    flagged: Boolean(result.flagged),
    categories: toBooleanRecord(result.categories),
    category_scores: toNumberRecord(result.category_scores),
  }
}

export async function transcribeVideoModerationAudio(
  audioPath: string
): Promise<string> {
  logger.info({
    event: "video_moderation.transcription_started",
    context: { audioPath },
  })

  const response = await openai.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: "gpt-4o-transcribe",
  })

  const text = response.text?.trim() ?? ""

  logger.info({
    event: "video_moderation.transcription_completed",
    context: {
      length: text.length,
    },
  })

  return text
}

export async function moderateVideoTranscript(
  text: string
): Promise<ModerationResultShape> {
  if (!text.trim()) {
    return {
      flagged: false,
      categories: {},
      category_scores: {},
    }
  }

  logger.info({
    event: "video_moderation.transcript_moderation_started",
    context: {
      length: text.length,
    },
  })

  const response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: text,
  })

  const result = response.results?.[0]

  if (!result) {
    throw new Error("Failed to moderate transcript")
  }

  logger.info({
    event: "video_moderation.transcript_moderation_completed",
    context: {
      flagged: result.flagged,
    },
  })

  return {
    flagged: Boolean(result.flagged),
    categories: toBooleanRecord(result.categories),
    category_scores: toNumberRecord(result.category_scores),
  }
}
