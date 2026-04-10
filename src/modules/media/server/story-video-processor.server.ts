import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import {
  StoryVideoJob,
  createStoryFromProcessedVideo,
  downloadTempStoryVideo,
  removeTempStoryVideo,
  uploadProcessedStoryVideo,
} from "./story-video-job.service";

const execFileAsync = promisify(execFile);

const MAX_STORY_VIDEO_SECONDS = 10;

export async function processStoryVideoJob(job: StoryVideoJob) {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "story-video-"));
  const inputPath = path.join(workDir, "input");
  const outputPath = path.join(workDir, "output.mp4");

  try {
    const inputBuffer = await downloadTempStoryVideo(job.temp_storage_path);
    await fs.writeFile(inputPath, inputBuffer);

    const duration = await getVideoDurationSeconds(inputPath);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Invalid video duration");
    }

    if (duration <= MAX_STORY_VIDEO_SECONDS) {
      await remuxOrTranscodeFullVideo(inputPath, outputPath);
    } else {
      const maxStartTime = Math.max(0, duration - MAX_STORY_VIDEO_SECONDS);

      if (job.start_time < 0 || job.start_time > maxStartTime) {
        throw new Error("Invalid startTime");
      }

      await trimVideo({
        inputPath,
        outputPath,
        startTime: job.start_time,
        durationSeconds: MAX_STORY_VIDEO_SECONDS,
      });
    }

    const outputBuffer = await fs.readFile(outputPath);
    const finalStoragePath = await uploadProcessedStoryVideo({
      creatorId: job.creator_id,
      localFileBuffer: outputBuffer,
      contentType: "video/mp4",
    });

    const storyId = await createStoryFromProcessedVideo({
      creatorId: job.creator_id,
      storagePath: finalStoragePath,
      visibility: job.visibility,
      expiresAt: job.expires_at,
    });

    return {
      storyId,
      finalStoragePath,
    };
  } finally {
    await safeRemoveTempStorage(job.temp_storage_path);
    await safeCleanupDir(workDir);
  }
}

export async function getVideoDurationSeconds(inputPath: string) {
  if (!ffprobe.path) {
    throw new Error("ffprobe binary not found");
  }

  const { stdout } = await execFileAsync(ffprobe.path, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);

  return Number.parseFloat(stdout.trim());
}

async function trimVideo(params: {
  inputPath: string;
  outputPath: string;
  startTime: number;
  durationSeconds: number;
}) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found");
  }

  await runFfmpeg([
    "-ss",
    String(params.startTime),
    "-i",
    params.inputPath,
    "-t",
    String(params.durationSeconds),
    "-movflags",
    "+faststart",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-y",
    params.outputPath,
  ]);
}

async function remuxOrTranscodeFullVideo(inputPath: string, outputPath: string) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not found");
  }

  await runFfmpeg([
    "-i",
    inputPath,
    "-movflags",
    "+faststart",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-y",
    outputPath,
  ]);
}

async function runFfmpeg(args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath as string, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `ffmpeg failed with code ${code}`));
    });
  });
}

async function safeCleanupDir(workDir: string) {
  await fs.rm(workDir, { recursive: true, force: true });
}

async function safeRemoveTempStorage(tempStoragePath: string) {
  try {
    await removeTempStoryVideo(tempStoragePath);
  } catch {
    // noop
  }
}