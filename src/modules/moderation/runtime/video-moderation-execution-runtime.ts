import os from "os"
import path from "path"

import type {
  ModerationResultShape,
  VideoModerationFrameResult,
  VideoModerationMediaResult,
} from "@/modules/moderation/contracts/video-moderation-runtime-contract"
import { cleanupVideoModerationTempRoot } from "@/modules/moderation/runtime/video-moderation-compensation"
import {
  downloadVideoModerationStorageFile,
  ensureVideoModerationDir,
  extractVideoModerationAudio,
  extractVideoModerationFrames,
} from "@/modules/moderation/runtime/video-moderation-file-runtime"
import {
  moderateVideoFrameFile,
  moderateVideoTranscript,
  transcribeVideoModerationAudio,
} from "@/modules/moderation/runtime/video-moderation-openai-runtime"
import { shouldRejectFromImageResult } from "@/modules/moderation/runtime/video-moderation-result-mappers"
import { logger } from "@/shared/observability/structured-logger"

function buildRejectedVideoModerationResult(input: {
  mediaId: string
  storagePath: string
  stage: "video_frame_moderation" | "video_transcript_moderation"
  framePaths: string[]
  frameResults: VideoModerationFrameResult[]
  transcriptText?: string
  transcriptModeration?: ModerationResultShape | null
}): VideoModerationMediaResult {
  return {
    mediaId: input.mediaId,
    storagePath: input.storagePath,
    decision: "rejected",
    summary: {
      provider: "openai",
      stage: input.stage,
      decision: "rejected",
      storagePath: input.storagePath,
      frameCount: input.framePaths.length,
      flaggedFrameCount: input.frameResults.filter((item) => item.flagged)
        .length,
      transcriptText: input.transcriptText,
      transcriptModeration: input.transcriptModeration,
      frameResults: input.frameResults,
    },
  }
}

function buildApprovedVideoModerationResult(input: {
  mediaId: string
  storagePath: string
  framePaths: string[]
  frameResults: VideoModerationFrameResult[]
  transcriptText: string
  transcriptModeration: ModerationResultShape | null
}): VideoModerationMediaResult {
  return {
    mediaId: input.mediaId,
    storagePath: input.storagePath,
    decision: "approved",
    summary: {
      provider: "openai",
      decision: "approved",
      storagePath: input.storagePath,
      frameCount: input.framePaths.length,
      flaggedFrameCount: input.frameResults.filter((item) => item.flagged)
        .length,
      transcriptText: input.transcriptText,
      transcriptModeration: input.transcriptModeration,
      frameResults: input.frameResults,
    },
  }
}

async function moderateVideoFrames(input: {
  mediaId: string
  storagePath: string
  framePaths: string[]
}): Promise<{
  frameResults: VideoModerationFrameResult[]
  rejectedResult: VideoModerationMediaResult | null
}> {
  const frameResults: VideoModerationFrameResult[] = []

  for (const framePath of input.framePaths) {
    const result = await moderateVideoFrameFile(framePath)

    frameResults.push({
      frame: path.basename(framePath),
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
    })

    if (shouldRejectFromImageResult(result) || result.flagged) {
      return {
        frameResults,
        rejectedResult: buildRejectedVideoModerationResult({
          mediaId: input.mediaId,
          storagePath: input.storagePath,
          stage: "video_frame_moderation",
          framePaths: input.framePaths,
          frameResults,
        }),
      }
    }
  }

  return {
    frameResults,
    rejectedResult: null,
  }
}

async function moderateVideoAudio(input: {
  mediaId: string
  storagePath: string
  videoPath: string
  audioPath: string
  framePaths: string[]
  frameResults: VideoModerationFrameResult[]
}): Promise<{
  transcriptText: string
  transcriptModeration: ModerationResultShape | null
  rejectedResult: VideoModerationMediaResult | null
}> {
  let transcriptText = ""
  let transcriptModeration: ModerationResultShape | null = null
  const hasAudio = await extractVideoModerationAudio(
    input.videoPath,
    input.audioPath
  )

  if (!hasAudio) {
    return {
      transcriptText,
      transcriptModeration,
      rejectedResult: null,
    }
  }

  transcriptText = await transcribeVideoModerationAudio(input.audioPath)
  transcriptModeration = await moderateVideoTranscript(transcriptText)

  if (transcriptModeration.flagged) {
    return {
      transcriptText,
      transcriptModeration,
      rejectedResult: buildRejectedVideoModerationResult({
        mediaId: input.mediaId,
        storagePath: input.storagePath,
        stage: "video_transcript_moderation",
        framePaths: input.framePaths,
        frameResults: input.frameResults,
        transcriptText,
        transcriptModeration,
      }),
    }
  }

  return {
    transcriptText,
    transcriptModeration,
    rejectedResult: null,
  }
}

export async function executeSingleVideoModeration(input: {
  postId: string
  mediaId: string
  storagePath: string
}): Promise<VideoModerationMediaResult> {
  const tempRoot = path.join(
    os.tmpdir(),
    "video-moderation",
    input.postId,
    input.mediaId
  )
  const videoPath = path.join(tempRoot, "input-video")
  const framesDir = path.join(tempRoot, "frames")
  const audioPath = path.join(tempRoot, "audio.mp3")

  logger.info({
    event: "video_moderation.single_video_started",
    context: input,
  })

  await ensureVideoModerationDir(framesDir)

  try {
    await downloadVideoModerationStorageFile(input.storagePath, videoPath)

    const framePaths = await extractVideoModerationFrames(videoPath, framesDir)

    if (framePaths.length === 0) {
      throw new Error("No frames extracted")
    }

    const frameModeration = await moderateVideoFrames({
      mediaId: input.mediaId,
      storagePath: input.storagePath,
      framePaths,
    })

    if (frameModeration.rejectedResult) {
      return frameModeration.rejectedResult
    }

    const audioModeration = await moderateVideoAudio({
      mediaId: input.mediaId,
      storagePath: input.storagePath,
      videoPath,
      audioPath,
      framePaths,
      frameResults: frameModeration.frameResults,
    })

    if (audioModeration.rejectedResult) {
      return audioModeration.rejectedResult
    }

    return buildApprovedVideoModerationResult({
      mediaId: input.mediaId,
      storagePath: input.storagePath,
      framePaths,
      frameResults: frameModeration.frameResults,
      transcriptText: audioModeration.transcriptText,
      transcriptModeration: audioModeration.transcriptModeration,
    })
  } finally {
    await cleanupVideoModerationTempRoot(tempRoot)
  }
}

export async function executeVideoModerationBatch(input: {
  postId: string
  media: Array<{ id: string; storagePath: string }>
}): Promise<VideoModerationMediaResult[]> {
  const results: VideoModerationMediaResult[] = []

  for (const item of input.media) {
    results.push(
      await executeSingleVideoModeration({
        postId: input.postId,
        mediaId: item.id,
        storagePath: item.storagePath,
      })
    )
  }

  return results
}
