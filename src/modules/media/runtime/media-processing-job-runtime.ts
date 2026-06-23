// src/modules/media/runtime/media-processing-job-runtime.ts

import {
  claimMediaProcessingJob,
  completeMediaProcessingJob,
  createMediaProcessingJob,
  failMediaProcessingJob,
  findMediaProcessingJobById,
  type MediaProcessingJobRow,
} from "@/modules/media/repositories/media-processing-job-repository"
import { updateMediaAssetProcessingStatus } from "@/modules/media/repositories/media-asset-repository"
import { writeDomainEventWithOutbox } from "@/modules/events/public"
import { buildMediaEventEnvelope } from "@/modules/media/events"





export type MediaProcessingJobContract = {
  jobId: string
  mediaId: string
  processorKind: string
  status: "pending" | "claimed" | "completed" | "failed"
  inputPayload: Record<string, unknown>
  resultPayload: Record<string, unknown> | null
  claimedBy: string | null
  claimedAt: string | null
  completedAt: string | null
  createdAt: string
}


async function requireMediaProcessingJob(jobId: string) {
  const job = await findMediaProcessingJobById(jobId)

  if (!job) {
    throw new Error("Media processing job not found")
  }

  return job
}

function mapProcessingJobRowToContract(
  row: MediaProcessingJobRow
): MediaProcessingJobContract {
  return {
    jobId: row.job_id,
    mediaId: row.media_id,
    processorKind: row.processor_kind,
    status: row.status,
    inputPayload: row.input_payload,
    resultPayload: row.result_payload,
    claimedBy: row.claimed_by,
    claimedAt: row.claimed_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

export async function queueMediaProcessingJobRuntime(input: {
  mediaId: string
  processorKind: string
  inputPayload: Record<string, unknown>
}): Promise<MediaProcessingJobContract> {
  const row = await createMediaProcessingJob({
    mediaId: input.mediaId,
    processorKind: input.processorKind,
    inputPayload: input.inputPayload,
  })

  await updateMediaAssetProcessingStatus({
    mediaId: input.mediaId,
    processingStatus: "processing",
  })

  await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "MediaProcessingStarted",
      aggregateId: input.mediaId,
      producerSurface: "media_processing_job_runtime.queue",
      sourceFile: "src/modules/media/runtime/media-processing-job-runtime.ts",
      sourceTable: "media_processing_jobs",
      sourceRowId: row.job_id,
      payload: {
        assetId: input.mediaId,
        jobId: row.job_id,
        processorKind: input.processorKind,
        status: "processing",
        startedAt: new Date().toISOString(),
      },
      idempotencyKey: `media_processing_started:${row.job_id}`,
      outboxRequired: true,
      replayable: true,
    }),
  )


  return mapProcessingJobRowToContract(row)
}

export async function claimMediaProcessingJobRuntime(input: {
  processorKind: string
  workerId: string
}): Promise<MediaProcessingJobContract | null> {
  const row = await claimMediaProcessingJob({
    processorKind: input.processorKind,
    workerId: input.workerId,
  })

  return row ? mapProcessingJobRowToContract(row) : null
}

export async function completeMediaProcessingJobRuntime(input: {
  jobId: string
  mediaId: string
  resultPayload: Record<string, unknown>
}): Promise<void> {
  await completeMediaProcessingJob({
    jobId: input.jobId,
    resultPayload: input.resultPayload,
  })

  await updateMediaAssetProcessingStatus({
    mediaId: input.mediaId,
    processingStatus: "ready",





  })


    await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "MediaReady",
      aggregateId: input.mediaId,
      producerSurface: "media_processing_job_runtime.complete",
      sourceFile: "src/modules/media/runtime/media-processing-job-runtime.ts",
      sourceTable: "media_processing_jobs",
      sourceRowId: input.jobId,
      payload: {
        assetId: input.mediaId,
        jobId: input.jobId,
        readyVersion: 1,
        resultPayload: input.resultPayload,
        readyAt: new Date().toISOString(),
      },
      idempotencyKey: `media_ready:${input.mediaId}:${input.jobId}:1`,
      outboxRequired: true,
      replayable: true,
    }),
  )
}

export async function failMediaProcessingJobRuntime(input: {
  jobId: string
  mediaId: string
  errorMessage: string
}): Promise<void> {
  await failMediaProcessingJob({
    jobId: input.jobId,
    errorMessage: input.errorMessage,
  })

  await updateMediaAssetProcessingStatus({
    mediaId: input.mediaId,
    processingStatus: "failed",


    
  })

  
    await writeDomainEventWithOutbox(
    buildMediaEventEnvelope({
      eventType: "MediaFailed",
      aggregateId: input.mediaId,
      producerSurface: "media_processing_job_runtime.fail",
      sourceFile: "src/modules/media/runtime/media-processing-job-runtime.ts",
      sourceTable: "media_processing_jobs",
      sourceRowId: input.jobId,
      payload: {
        assetId: input.mediaId,
        jobId: input.jobId,
        reason: input.errorMessage,
        failedAt: new Date().toISOString(),
      },
      idempotencyKey: `media_failed:${input.mediaId}:${input.jobId}`,
      outboxRequired: true,
      replayable: true,
    }),
  )

}