import OpenAI from "openai"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createPost } from "@/modules/post/server/create-post"
import { createPostAuthoringMedia } from "@/modules/media/server/create-media"
import { updatePostStatus } from "@/modules/post/server/update-post-status"
import { enqueueVideoModeration } from "@/modules/moderation/server/enqueue-video-moderation"
import { createPostBlocks } from "@/modules/post/server/create-post-blocks"
import {
  extractCreatePostModerationFiles,
  projectCreatePostDraft,
  resolveCreatePostPersistenceFromProjection,
} from "@/modules/post/server/create-post-draft-policy"

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

  const { data: creatorRow } = await supabaseAdmin
    .from("creators")
    .select("user_id")
    .eq("id", creatorId)
    .single()

  if (!creatorRow?.user_id) {
    throw new Error("Creator user not found")
  }

  // ✅ draft → projection
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

  // ✅ media 생성
  const persistedMedia: CreatePostPersistedMediaMappingItem[] = []

  for (const mediaItem of projectedDraft.mediaToCreate) {
    const mediaRow = await createPostAuthoringMedia({
      postId: post.id,
      ownerUserId: creatorRow.user_id,
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
    await enqueueVideoModeration({
      postId: post.id,
      publishIntent: status === "scheduled" ? "scheduled" : "published",
      publishedAt,
      media,
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

  return {
    post,
    media,
  }
}
