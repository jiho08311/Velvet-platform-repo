import { execFile } from "child_process"
import { promises as fs } from "fs"
import path from "path"
import { promisify } from "util"

import { downloadMediaStorageFile } from "@/modules/media/public/download-media-storage-file"
import { logger } from "@/shared/observability/structured-logger"

const execFileAsync = promisify(execFile)

const VIDEO_FRAME_COUNT = Math.max(
  3,
  Number(process.env.VIDEO_MODERATION_FRAME_COUNT ?? 6)
)

export async function ensureVideoModerationDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}

function toNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

async function getVideoDuration(videoPath: string): Promise<number> {
  logger.info({
    event: "video_moderation.ffprobe_started",
    context: { videoPath },
  })

  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ])

  const duration = Math.max(0, toNumber(stdout.trim()))

  logger.info({
    event: "video_moderation.ffprobe_completed",
    context: { duration },
  })

  return duration
}

function buildTimestamps(durationSeconds: number, count: number): number[] {
  if (durationSeconds <= 1) {
    return [0]
  }

  const maxTimestamp = Math.max(0, durationSeconds - 0.25)
  const timestamps = new Set<number>([0, maxTimestamp])

  for (let index = 1; index < count - 1; index += 1) {
    const ratio = index / (count - 1)
    const timestamp = Number((maxTimestamp * ratio).toFixed(2))
    timestamps.add(timestamp)
  }

  return [...timestamps].sort((a, b) => a - b)
}

export async function downloadVideoModerationStorageFile(
  storagePath: string,
  outputPath: string
): Promise<void> {
  logger.info({
    event: "video_moderation.storage_download_started",
    context: { storagePath },
  })

  try {
    const arrayBuffer = await downloadMediaStorageFile({ storagePath })
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer))
  } catch (error) {
    logger.error({
      event: "video_moderation.storage_download_failed",
      context: { storagePath },
      error,
    })
    throw error
  }

  logger.info({
    event: "video_moderation.storage_download_completed",
    context: {
      storagePath,
      outputPath,
    },
  })
}

export async function extractVideoModerationFrames(
  videoPath: string,
  framesDir: string
): Promise<string[]> {
  logger.info({
    event: "video_moderation.extract_frames_started",
    context: {
      videoPath,
      framesDir,
    },
  })

  const duration = await getVideoDuration(videoPath)
  const timestamps = buildTimestamps(duration, VIDEO_FRAME_COUNT)
  const framePaths: string[] = []

  logger.info({
    event: "video_moderation.frame_timestamps_selected",
    context: { timestamps },
  })

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index]
    const framePath = path.join(framesDir, `frame-${index}.jpg`)

    await execFileAsync("ffmpeg", [
      "-y",
      "-ss",
      String(timestamp),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      framePath,
    ])

    framePaths.push(framePath)
  }

  logger.info({
    event: "video_moderation.extract_frames_completed",
    context: {
      frameCount: framePaths.length,
    },
  })

  return framePaths
}

export async function extractVideoModerationAudio(
  videoPath: string,
  audioPath: string
): Promise<boolean> {
  logger.info({
    event: "video_moderation.extract_audio_started",
    context: { audioPath },
  })

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i",
      videoPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-b:a",
      "64k",
      audioPath,
    ])

    logger.info({
      event: "video_moderation.extract_audio_completed",
      context: { audioPath },
    })
    return true
  } catch (error) {
    logger.error({
      event: "video_moderation.extract_audio_failed",
      error,
    })
    return false
  }
}
