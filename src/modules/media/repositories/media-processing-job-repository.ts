// src/modules/media/repositories/media-processing-job-repository.ts

import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export type MediaProcessingJobStatus =
  | "pending"
  | "claimed"
  | "completed"
  | "failed"

export type MediaProcessingJobRow = {
  job_id: string
  media_id: string
  processor_kind: string
  status: MediaProcessingJobStatus
  input_payload: Record<string, unknown>
  result_payload: Record<string, unknown> | null
  claimed_by: string | null
  claimed_at: string | null
  completed_at: string | null
  created_at: string
}


export async function findMediaProcessingJobById(
  jobId: string
): Promise<MediaProcessingJobRow | null> {
  const { data, error } = await supabaseAdmin
    .from("media_processing_jobs")
    .select("*")
    .eq("job_id", jobId)
    .maybeSingle<MediaProcessingJobRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function createMediaProcessingJob(input: {
  mediaId: string
  processorKind: string
  inputPayload: Record<string, unknown>
}): Promise<MediaProcessingJobRow> {
  const { data, error } = await supabaseAdmin
    .from("media_processing_jobs")
    .insert({
      media_id: input.mediaId,
      processor_kind: input.processorKind,
      status: "pending",
      input_payload: input.inputPayload,
    })
    .select("*")
    .single<MediaProcessingJobRow>()

  if (error || !data) {
    throw error ?? new Error("Failed to create media processing job")
  }

  return data
}

export async function claimMediaProcessingJob(input: {
  processorKind: string
  workerId: string
}): Promise<MediaProcessingJobRow | null> {
  const { data, error } = await supabaseAdmin
    .from("media_processing_jobs")
    .update({
      status: "claimed",
      claimed_by: input.workerId,
      claimed_at: new Date().toISOString(),
    })
    .eq("processor_kind", input.processorKind)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .select("*")
    .maybeSingle<MediaProcessingJobRow>()

  if (error) {
    throw error
  }

  return data ?? null
}

export async function completeMediaProcessingJob(input: {
  jobId: string
  resultPayload: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("media_processing_jobs")
    .update({
      status: "completed",
      result_payload: input.resultPayload,
      completed_at: new Date().toISOString(),
    })
    .eq("job_id", input.jobId)

  if (error) {
    throw error
  }
}

export async function failMediaProcessingJob(input: {
  jobId: string
  errorMessage: string
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from("media_processing_jobs")
    .update({
      status: "failed",
      result_payload: {
        errorMessage: input.errorMessage,
      },
      completed_at: new Date().toISOString(),
    })
    .eq("job_id", input.jobId)

  if (error) {
    throw error
  }
}