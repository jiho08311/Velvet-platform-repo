"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoModeration = processVideoModeration;
const openai_1 = __importDefault(require("openai"));
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const admin_1 = require("../infrastructure/supabase/admin");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const MEDIA_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media";
const VIDEO_FRAME_COUNT = Math.max(3, Number(process.env.VIDEO_MODERATION_FRAME_COUNT ?? 6));
const VIDEO_REVIEW_THRESHOLD = Number(process.env.VIDEO_REVIEW_THRESHOLD ?? 0.75);
function toBooleanRecord(value) {
    if (!value || typeof value !== "object") {
        return {};
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Boolean(item)]));
}
function toNumberRecord(value) {
    if (!value || typeof value !== "object") {
        return {};
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Number(item) || 0]));
}
async function ensureDir(dirPath) {
    await fs_1.promises.mkdir(dirPath, { recursive: true });
}
async function safeRm(targetPath) {
    try {
        await fs_1.promises.rm(targetPath, { recursive: true, force: true });
    }
    catch { }
}
function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
async function getVideoDuration(videoPath) {
    console.log("[video-moderation] ffprobe start", { videoPath });
    const { stdout } = await execFileAsync("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        videoPath,
    ]);
    const duration = Math.max(0, toNumber(stdout.trim()));
    console.log("[video-moderation] ffprobe done", { duration });
    return duration;
}
function buildTimestamps(durationSeconds, count) {
    if (durationSeconds <= 1) {
        return [0];
    }
    const maxTimestamp = Math.max(0, durationSeconds - 0.25);
    const timestamps = new Set([0, maxTimestamp]);
    for (let index = 1; index < count - 1; index += 1) {
        const ratio = index / (count - 1);
        const timestamp = Number((maxTimestamp * ratio).toFixed(2));
        timestamps.add(timestamp);
    }
    return [...timestamps].sort((a, b) => a - b);
}
async function downloadStorageFile(storagePath, outputPath) {
    console.log("[video-moderation] storage download start", { storagePath });
    const { data, error } = await admin_1.supabaseAdmin.storage
        .from(MEDIA_BUCKET)
        .download(storagePath);
    if (error || !data) {
        console.error("[video-moderation] storage download failed", {
            storagePath,
            error,
        });
        throw error ?? new Error("Failed to download video from storage");
    }
    const arrayBuffer = await data.arrayBuffer();
    await fs_1.promises.writeFile(outputPath, Buffer.from(arrayBuffer));
    console.log("[video-moderation] storage download done", {
        storagePath,
        outputPath,
    });
}
async function extractFrames(videoPath, framesDir) {
    console.log("[video-moderation] extract frames start", {
        videoPath,
        framesDir,
    });
    const duration = await getVideoDuration(videoPath);
    const timestamps = buildTimestamps(duration, VIDEO_FRAME_COUNT);
    const framePaths = [];
    console.log("[video-moderation] frame timestamps", { timestamps });
    for (let index = 0; index < timestamps.length; index += 1) {
        const timestamp = timestamps[index];
        const framePath = path_1.default.join(framesDir, `frame-${index}.jpg`);
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
        ]);
        framePaths.push(framePath);
    }
    console.log("[video-moderation] extract frames done", {
        frameCount: framePaths.length,
    });
    return framePaths;
}
async function extractAudio(videoPath, audioPath) {
    console.log("[video-moderation] extract audio start", { audioPath });
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
        ]);
        console.log("[video-moderation] extract audio done", { audioPath });
        return true;
    }
    catch (error) {
        console.error("[video-moderation] extract audio failed", error);
        return false;
    }
}
async function moderateImageFile(framePath) {
    console.log("[video-moderation] image moderation start", { framePath });
    const buffer = await fs_1.promises.readFile(framePath);
    const base64 = buffer.toString("base64");
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
    });
    const result = response.results?.[0];
    if (!result) {
        throw new Error("Failed to moderate video frame");
    }
    console.log("[video-moderation] image moderation done", {
        framePath,
        flagged: result.flagged,
    });
    return {
        flagged: Boolean(result.flagged),
        categories: toBooleanRecord(result.categories),
        category_scores: toNumberRecord(result.category_scores),
    };
}
function shouldRejectFromImageResult(result) {
    const categories = result.categories ?? {};
    const scores = result.category_scores ?? {};
    return (categories["sexual/minors"] === true ||
        categories["violence/graphic"] === true ||
        categories["self-harm/intent"] === true ||
        categories["self-harm/instructions"] === true ||
        categories["illicit/violent"] === true ||
        (scores["sexual"] ?? 0) >= VIDEO_REVIEW_THRESHOLD ||
        (scores["violence"] ?? 0) >= VIDEO_REVIEW_THRESHOLD);
}
async function transcribeAudio(audioPath) {
    console.log("[video-moderation] transcription start", { audioPath });
    const response = await openai.audio.transcriptions.create({
        file: (0, fs_1.createReadStream)(audioPath),
        model: "gpt-4o-transcribe",
    });
    const text = response.text?.trim() ?? "";
    console.log("[video-moderation] transcription done", {
        length: text.length,
    });
    return text;
}
async function moderateText(text) {
    if (!text.trim()) {
        return {
            flagged: false,
            categories: {},
            category_scores: {},
        };
    }
    console.log("[video-moderation] transcript moderation start", {
        length: text.length,
    });
    const response = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: text,
    });
    const result = response.results?.[0];
    if (!result) {
        throw new Error("Failed to moderate transcript");
    }
    console.log("[video-moderation] transcript moderation done", {
        flagged: result.flagged,
    });
    return {
        flagged: Boolean(result.flagged),
        categories: toBooleanRecord(result.categories),
        category_scores: toNumberRecord(result.category_scores),
    };
}
async function getCurrentPostStatus(postId) {
    const { data, error } = await admin_1.supabaseAdmin
        .from("posts")
        .select("status")
        .eq("id", postId)
        .maybeSingle();
    if (error) {
        throw error;
    }
    return data?.status ?? null;
}
async function markMediaApproved(mediaId, summary) {
    const now = new Date().toISOString();
    console.log("[video-moderation] mark media approved", { mediaId });
    const { error } = await admin_1.supabaseAdmin
        .from("media")
        .update({
        status: "ready",
        processing_status: "ready",
        moderation_status: "approved",
        moderation_summary: summary,
        moderation_completed_at: now,
    })
        .eq("id", mediaId);
    if (error) {
        throw error;
    }
}
async function markMediaRejected(mediaId, summary) {
    const now = new Date().toISOString();
    console.log("[video-moderation] mark media rejected", { mediaId });
    const { error } = await admin_1.supabaseAdmin
        .from("media")
        .update({
        status: "failed",
        processing_status: "failed",
        moderation_status: "rejected",
        moderation_summary: summary,
        moderation_completed_at: now,
    })
        .eq("id", mediaId);
    if (error) {
        throw error;
    }
}
async function markMediaNeedsReview(mediaId, summary) {
    const now = new Date().toISOString();
    console.log("[video-moderation] mark media needs_review", { mediaId });
    const { error } = await admin_1.supabaseAdmin
        .from("media")
        .update({
        status: "failed",
        processing_status: "failed",
        moderation_status: "needs_review",
        moderation_summary: summary,
        moderation_completed_at: now,
    })
        .eq("id", mediaId);
    if (error) {
        throw error;
    }
}
async function updatePostApproved(postId) {
    const currentStatus = await getCurrentPostStatus(postId);
    if (currentStatus === "archived") {
        return;
    }
    const now = new Date().toISOString();
    console.log("[video-moderation] update post approved", { postId });
    const { error } = await admin_1.supabaseAdmin
        .from("posts")
        .update({
        status: "published",
        visibility_status: "published",
        moderation_status: "approved",
        moderation_completed_at: now,
        updated_at: now,
    })
        .eq("id", postId);
    if (error) {
        throw error;
    }
}
async function updatePostRejected(postId) {
    const now = new Date().toISOString();
    console.log("[video-moderation] update post rejected", { postId });
    const { error } = await admin_1.supabaseAdmin
        .from("posts")
        .update({
        status: "archived",
        visibility_status: "rejected",
        moderation_status: "rejected",
        moderation_completed_at: now,
        updated_at: now,
    })
        .eq("id", postId);
    if (error) {
        throw error;
    }
}
async function updatePostNeedsReview(postId) {
    const now = new Date().toISOString();
    console.log("[video-moderation] update post needs_review", { postId });
    const { error } = await admin_1.supabaseAdmin
        .from("posts")
        .update({
        status: "draft",
        visibility_status: "processing",
        moderation_status: "needs_review",
        moderation_completed_at: now,
        updated_at: now,
    })
        .eq("id", postId);
    if (error) {
        throw error;
    }
}
async function processSingleVideo({ postId, mediaId, storagePath, }) {
    const tempRoot = path_1.default.join(os_1.default.tmpdir(), "video-moderation", postId, mediaId);
    const videoPath = path_1.default.join(tempRoot, "input-video");
    const framesDir = path_1.default.join(tempRoot, "frames");
    const audioPath = path_1.default.join(tempRoot, "audio.mp3");
    console.log("[video-moderation] process single video start", {
        postId,
        mediaId,
        storagePath,
    });
    await ensureDir(framesDir);
    try {
        await downloadStorageFile(storagePath, videoPath);
        const framePaths = await extractFrames(videoPath, framesDir);
        if (framePaths.length === 0) {
            throw new Error("No frames extracted");
        }
        const frameResults = [];
        for (const framePath of framePaths) {
            const result = await moderateImageFile(framePath);
            frameResults.push({
                frame: path_1.default.basename(framePath),
                flagged: result.flagged,
                categories: result.categories,
                category_scores: result.category_scores,
            });
            if (shouldRejectFromImageResult(result) || result.flagged) {
                const summary = {
                    provider: "openai",
                    stage: "video_frame_moderation",
                    decision: "rejected",
                    storagePath,
                    frameCount: framePaths.length,
                    flaggedFrameCount: frameResults.filter((item) => item.flagged).length,
                    frameResults,
                };
                await markMediaRejected(mediaId, summary);
                await updatePostRejected(postId);
                return;
            }
        }
        let transcriptText = "";
        let transcriptModeration = null;
        const hasAudio = await extractAudio(videoPath, audioPath);
        if (hasAudio) {
            transcriptText = await transcribeAudio(audioPath);
            transcriptModeration = await moderateText(transcriptText);
            if (transcriptModeration.flagged) {
                const summary = {
                    provider: "openai",
                    stage: "video_transcript_moderation",
                    decision: "rejected",
                    storagePath,
                    frameCount: framePaths.length,
                    flaggedFrameCount: frameResults.filter((item) => item.flagged).length,
                    transcriptText,
                    transcriptModeration,
                    frameResults,
                };
                await markMediaRejected(mediaId, summary);
                await updatePostRejected(postId);
                return;
            }
        }
        const approvedSummary = {
            provider: "openai",
            decision: "approved",
            storagePath,
            frameCount: framePaths.length,
            flaggedFrameCount: frameResults.filter((item) => item.flagged).length,
            transcriptText,
            transcriptModeration,
            frameResults,
        };
        await markMediaApproved(mediaId, approvedSummary);
    }
    finally {
        await safeRm(tempRoot);
    }
}
async function processVideoModeration({ postId, media, }) {
    console.log("[video-moderation] start", { postId, media });
    const videoMedia = media.filter((item) => item.type === "video" && item.storagePath.trim().length > 0);
    console.log("[video-moderation] filtered video media", {
        count: videoMedia.length,
        videoMedia,
    });
    if (videoMedia.length === 0) {
        await updatePostApproved(postId);
        return;
    }
    try {
        for (const item of videoMedia) {
            await processSingleVideo({
                postId,
                mediaId: item.id,
                storagePath: item.storagePath,
            });
        }
        const { data, error } = await admin_1.supabaseAdmin
            .from("media")
            .select("moderation_status")
            .eq("post_id", postId)
            .returns();
        if (error) {
            throw error;
        }
        const statuses = (data ?? []).map((item) => item.moderation_status);
        console.log("[video-moderation] final statuses", { statuses });
        if (statuses.some((status) => status === "rejected")) {
            await updatePostRejected(postId);
            return;
        }
        if (statuses.some((status) => status === "needs_review")) {
            await updatePostNeedsReview(postId);
            return;
        }
        await updatePostApproved(postId);
    }
    catch (error) {
        console.error("[video-moderation] failed", error);
        for (const item of videoMedia) {
            await markMediaNeedsReview(item.id, {
                provider: "openai",
                decision: "needs_review",
                reason: error instanceof Error ? error.message : "video moderation failed",
                storagePath: item.storagePath,
            });
        }
        await updatePostNeedsReview(postId);
    }
}
