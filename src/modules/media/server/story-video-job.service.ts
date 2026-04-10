import { createClient } from "@supabase/supabase-js";

export type StoryVideoJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type StoryVideoJob = {
  id: string;
  creator_id: string;
  temp_storage_path: string;
  trimmed_storage_path: string | null;
  story_id: string | null;
  visibility: string;
  start_time: number;
  expires_at: string;
  status: StoryVideoJobStatus;
  attempts: number;
  error_message: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STORIES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

const STORIES_TEMP_BUCKET =
  process.env.STORIES_TEMP_BUCKET ?? "media-temp"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function enqueueStoryVideoJob(params: {
  userId: string;
  file: File;
  visibility: string;
  startTime: number;
  expiresAt: string;
}) {
  const admin = createAdminClient();

  const { data: creator, error: creatorError } = await admin
    .from("creators")
    .select("id")
    .eq("user_id", params.userId)
    .single();

  if (creatorError || !creator) {
    throw new Error("Creator not found");
  }

  const ext = getFileExtension(params.file.name, params.file.type);
  const tempPath = `${creator.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const fileBuffer = Buffer.from(await params.file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(STORIES_TEMP_BUCKET)
    .upload(tempPath, fileBuffer, {
      contentType: params.file.type || "video/mp4",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: job, error: jobError } = await admin
    .from("story_video_jobs")
    .insert({
      creator_id: creator.id,
      temp_storage_path: tempPath,
      visibility: params.visibility,
      start_time: params.startTime,
      expires_at: params.expiresAt,
      status: "pending",
    })
    .select("*")
    .single();

  if (jobError || !job) {
    await admin.storage.from(STORIES_TEMP_BUCKET).remove([tempPath]);
    throw new Error(jobError?.message || "Failed to create job");
  }

  return job as StoryVideoJob;
}

export async function claimStoryVideoJob() {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("claim_story_video_job");

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return data as StoryVideoJob;
}

export async function markStoryVideoJobCompleted(params: {
  jobId: string;
  storyId: string;
  trimmedStoragePath: string;
}) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("story_video_jobs")
    .update({
      status: "completed",
      story_id: params.storyId,
      trimmed_storage_path: params.trimmedStoragePath,
      error_message: null,
      locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.jobId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markStoryVideoJobFailed(params: {
  jobId: string;
  errorMessage: string;
}) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("story_video_jobs")
    .update({
      status: "failed",
      error_message: params.errorMessage,
      locked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.jobId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createStoryFromProcessedVideo(params: {
  creatorId: string;
  storagePath: string;
  visibility: string;
  expiresAt: string;
}) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("stories")
    .insert({
      creator_id: params.creatorId,
      storage_path: params.storagePath,
      visibility: params.visibility,
      expires_at: params.expiresAt,
      is_deleted: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create story");
  }

  return data.id as string;
}

export async function getStoryVideoJobForUser(params: {
  jobId: string;
  userId: string;
}) {
  const admin = createAdminClient();

  const { data: creator, error: creatorError } = await admin
    .from("creators")
    .select("id")
    .eq("user_id", params.userId)
    .single();

  if (creatorError || !creator) {
    throw new Error("Creator not found");
  }

  const { data: job, error: jobError } = await admin
    .from("story_video_jobs")
    .select("id, status, error_message, story_id, created_at, updated_at")
    .eq("id", params.jobId)
    .eq("creator_id", creator.id)
    .single();

  if (jobError || !job) {
    throw new Error("Job not found");
  }

  return job;
}

export async function downloadTempStoryVideo(tempStoragePath: string) {
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(STORIES_TEMP_BUCKET)
    .download(tempStoragePath);

  if (error || !data) {
    throw new Error(error?.message || "Failed to download temp story video");
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function uploadProcessedStoryVideo(params: {
  creatorId: string;
  localFileBuffer: Buffer;
  contentType?: string;
}) {
  const admin = createAdminClient();

  const storagePath = `${params.creatorId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.mp4`;

  const { error } = await admin.storage
    .from(STORIES_BUCKET)
    .upload(storagePath, params.localFileBuffer, {
      contentType: params.contentType ?? "video/mp4",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return storagePath;
}

export async function removeTempStoryVideo(tempStoragePath: string) {
  const admin = createAdminClient();

  await admin.storage.from(STORIES_TEMP_BUCKET).remove([tempStoragePath]);
}

function getFileExtension(fileName: string, mimeType: string) {
  const byName = fileName.split(".").pop()?.toLowerCase();

  if (byName && byName.length <= 5) {
    return byName;
  }

  if (mimeType.includes("quicktime")) {
    return "mov";
  }

  return "mp4";
}