import OpenAI from "openai"
import { createPost } from "@/modules/post/public/create-post"
import { createPostAuthoringMedia } from "@/modules/media/public/create-post-authoring-media"
import { updatePostStatus } from "@/modules/post/public/update-post-status"
import { requestVideoModeration } from "@/modules/governance/public/moderation-governance-contract"
import { createPostBlocks } from "@/modules/post/public/create-post-blocks"
import { withWorkflowCorrelation } from "@/shared/observability/propagate-correlation-id"
import {
  extractCreatePostModerationFiles,
  projectCreatePostDraft,
  resolveCreatePostPersistenceFromProjection,
} from "@/modules/post/public/create-post-draft-policy"
import { readCreatorIdentityByCreatorId } from "@/modules/identity/public/creator-identity-read-model"
import { rebuildFeedProjectionForPost } from "@/modules/post/public/rebuild-feed-projection"
import type {
  CreatePostDraftBlock,
  CreatePostPersistedMediaMappingItem,
  CreatePostUploadedMediaInput,
} from "@/modules/post/types"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function resolveUploadedMediaType(type: string): "image" | "video" | "audio" | "file" {
  if (type === "image") return "image"
  if (type === "video") return "video"
  if (type === "audio") return "audio"
  return "file"
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkTextSafety(text: string) {
  const trimmed = text.trim()

  if (!trimmed) {
    return
  }

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

async function checkPostSafety({
  text,
  files,
}: {
  text?: string | null
  files: CreatePostUploadedMediaInput[]
}) {
  if (!text && files.length === 0) return
  await sleep(10)
}

async function moderatePostAndApplyTransition({
  postId,
  content,
  files,
  publishIntent,
  publishedAt = null,
}: {
  postId: string
  content?: string | null
  files: CreatePostUploadedMediaInput[]
  publishIntent: "published" | "scheduled"
  publishedAt?: string | null
}) {
  await checkPostSafety({ text: content, files })

  await updatePostStatus({
    postId,
    outcome: "approved",
    publishIntent,
    publishedAt,
    clearRejectionReason: true,
  })
}

async function applyInitialVideoModerationTransition(postId: string) {
  await updatePostStatus({
    postId,
    outcome: "pending",
    clearRejectionReason: true,
  })
}

export async function createPostWithMediaWorkflow({
  creatorId,
  title,
  content,
  status = "draft",
  visibility = "subscribers",
  price = 0,
  publishedAt = null,
  blocks = [],
}: {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: "draft" | "scheduled" | "published" | "archived"
  visibility?: "public" | "subscribers" | "paid"
  price?: number
  publishedAt?: string | null
  blocks?: CreatePostDraftBlock[]
}) {
  const resolvedPrice = visibility === "paid" ? price : 0

  const creator = await readCreatorIdentityByCreatorId(creatorId)

  if (!creator?.userId) {
    throw new Error("Creator user not found")
  }

  const projectedDraft = projectCreatePostDraft({ blocks })

  const resolvedContent = projectedDraft.content ?? content ?? null
  const moderationFiles = extractCreatePostModerationFiles({
    projection: projectedDraft,
  })

  const hasVideo = moderationFiles.some(
    (file) => resolveUploadedMediaType(file.type) === "video"
  )

  const post = await createPost({
    creatorId,
    title,
    content: resolvedContent,
    status: hasVideo ? "draft" : status,
    visibility,
    price: resolvedPrice,
    publishedAt,
  })

  if (hasVideo) {
    await applyInitialVideoModerationTransition(post.id)
  }

  const persistedMedia: CreatePostPersistedMediaMappingItem[] = []

  for (const mediaItem of projectedDraft.mediaToCreate) {
    const mediaRow = await createPostAuthoringMedia({
      postId: post.id,
      ownerUserId: creator.userId,
      media: mediaItem,
    })

    persistedMedia.push({
      projectionKey: mediaItem.projectionKey,
      mediaId: mediaRow.id,
      type: mediaRow.type,
      storagePath: mediaRow.storagePath,
    })
  }

  const persistencePlan = resolveCreatePostPersistenceFromProjection({
    projection: projectedDraft,
    persistedMedia,
  })

  await createPostBlocks(post.id, persistencePlan.blocksToInsert)
  const media = persistencePlan.resolvedMedia

  if (hasVideo) {
    const correlation = withWorkflowCorrelation(
      undefined,
      "create-post-with-media"
    )

    await requestVideoModeration({
      postId: post.id,
      publishIntent: status === "scheduled" ? "scheduled" : "published",
      publishedAt,
      media,
      correlation,
    })
  } else {
    await moderatePostAndApplyTransition({
      postId: post.id,
      content: resolvedContent,
      files: moderationFiles,
      publishIntent: status === "scheduled" ? "scheduled" : "published",
      publishedAt,
    })
  }

  await rebuildFeedProjectionForPost({
  postId: post.id,
  projectionSurface: "home_feed",
})

  return {
    post,
    media,
  }
}
