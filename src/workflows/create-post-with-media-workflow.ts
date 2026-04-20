import OpenAI from "openai"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createPost } from "@/modules/post/server/create-post"
import { createMedia } from "@/modules/media/server/create-media"
import { updatePostStatus } from "@/modules/post/server/update-post-status"
import { enqueueVideoModeration } from "@/modules/moderation/server/enqueue-video-moderation"
import { createPostBlocks } from "@/modules/post/server/create-post-blocks"
import {
  projectCreatePostDraft,
} from "@/modules/post/server/create-post-draft-policy"
import type {
  CreatePostBlockInput,
  CreatePostDraftBlock,
  CreatePostUploadedMediaInput,
} from "@/modules/post/types"

type UploadedFileInput = CreatePostUploadedMediaInput

type CreatePostWithMediaWorkflowInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: "draft" | "scheduled" | "published" | "archived"
  visibility?: "public" | "subscribers" | "paid"
  price?: number
  publishedAt?: string | null
  files: UploadedFileInput[]
  blocks?: {
    type: "text" | "image" | "video" | "audio" | "file"
    content?: string | null
    sortOrder: number
    mediaId?: string | null
    editorState?: CreatePostBlockInput["editorState"]
  }[]
}

type MediaType = "image" | "video" | "audio" | "file"

type CreatedMedia = {
  id: string
  type: MediaType
  storagePath: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const KOREAN_BAD_WORDS = [
  "씨발",
  "시발",
  "ㅅㅂ",
  "ㅆㅂ",
  "병신",
  "븅신",
  "ㅂㅅ",
  "좆",
  "좃",
  "ㅈ같",
  "ㅈㄹ",
  "지랄",
  "지1랄",
  "지럴",
  "개새끼",
  "개새",
  "개새끼야",
  "꺼져",
  "닥쳐",
  "닥쳐라",
  "섹스",
  "sex",
  "야스",
  "보지",
  "자지",
  "좆집",
  "딸딸이",
  "딸치",
  "자위",
  "음란",
  "야동",
  "porn",
  "nude",
  "누드",
  "알몸",
  "강간",
  "성폭행",
  "성추행",
  "죽여",
  "죽인다",
  "죽고싶",
  "죽을래",
  "살인",
  "패버린다",
  "쳐죽",
  "맞아죽",
  "칼로",
  "총으로",
  "죽여버",
  "멍청이",
  "바보새끼",
  "또라이",
  "정신병자",
  "미친놈",
  "미친년",
  "개같은",
  "쓰레기",
  "인간쓰레기",
  "벌레같은",
  "역겨운",
  "ㅅㅅ",
  "ㅂㅈ",
  "ㅈㅈ",
  "ㅁㅊ",
  "미쳤",
  "개같",
  "좆같",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "노출",
  "유두",
  "가슴",
  "엉덩이",
  "성기",
  "클리",
  "음경",
]

function containsBadWords(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "")

  return KOREAN_BAD_WORDS.some((word) => normalized.includes(word))
}

function resolveUploadedMediaType(type: string): MediaType {
  if (type === "image") return "image"
  if (type === "video") return "video"
  if (type === "audio") return "audio"
  return "file"
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function checkTextSafety(text?: string | null) {
  const resolvedText = text?.trim() ?? ""

  if (!resolvedText) return

  if (containsBadWords(resolvedText)) {
    throw new Error("TEXT_BLOCKED")
  }

  for (const delay of [0, 800, 1600]) {
    if (delay > 0) await sleep(delay)

    try {
      const response = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: resolvedText,
      })

      const result = response.results?.[0]

      if (!result) throw new Error("Failed to moderate text")
      if (result.flagged) throw new Error("TEXT_BLOCKED")

      return
    } catch (error: any) {
      if (error?.status !== 429) throw error
    }
  }

  throw new Error("Text moderation temporarily unavailable")
}

async function checkImageSafety(file: File | UploadedFileInput) {
  const isBrowserFile = file instanceof File
  const mimeType = isBrowserFile ? file.type : file.mimeType

  if (!mimeType.startsWith("image/")) return

  for (const delay of [0, 800, 1600]) {
    if (delay > 0) await sleep(delay)

    try {
      let base64: string

      if (isBrowserFile) {
        const buffer = await file.arrayBuffer()
        base64 = Buffer.from(buffer).toString("base64")
      } else {
        const bucket =
          process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(file.path)

        if (error || !data) {
          throw error ?? new Error("Failed to download image from storage")
        }

        const arrayBuffer = await data.arrayBuffer()
        base64 = Buffer.from(arrayBuffer).toString("base64")
      }

      const response = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      })

      const result = response.results?.[0]

      if (!result) throw new Error("Failed to moderate image")
      if (result.flagged) throw new Error("IMAGE_BLOCKED")

      return
    } catch (error: any) {
      if (error?.status !== 429) throw error
    }
  }

  throw new Error("Image moderation temporarily unavailable")
}

async function checkPostSafety({
  text,
  files,
}: {
  text?: string | null
  files: Array<File | UploadedFileInput>
}) {
  await checkTextSafety(text)

  for (const file of files) {
    await checkImageSafety(file)
  }
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
  files: Array<File | UploadedFileInput>
  publishIntent: "published" | "scheduled"
  publishedAt?: string | null
}) {
  try {
    await checkPostSafety({
      text: content,
      files,
    })

    await updatePostStatus({
      postId,
      outcome: "approved",
      publishIntent,
      publishedAt,
      clearRejectionReason: true,
    })
  } catch (error) {
    console.error("[moderation] blocked:", error)

    await updatePostStatus({
      postId,
      outcome: "rejected",
    })
  }
}

async function applyInitialVideoModerationTransition(postId: string) {
  await updatePostStatus({
    postId,
    outcome: "pending",
    clearRejectionReason: true,
  })
}

function buildCreateDraftBlocksFromLegacyInput(params: {
  blocks: NonNullable<CreatePostWithMediaWorkflowInput["blocks"]>
  files: UploadedFileInput[]
}): CreatePostDraftBlock[] {
  const uploadedMediaBySortOrder = new Map<number, UploadedFileInput>()

  for (const file of params.files) {
    // legacy path safety fallback: keep original relative order
    // later surfaces will stop relying on this
    const nextIndex = uploadedMediaBySortOrder.size
    uploadedMediaBySortOrder.set(nextIndex, file)
  }

  let uploadedMediaIndex = 0

  return params.blocks.map((block) => {
    if (block.type === "text") {
      return {
        type: "text" as const,
        content: block.content ?? "",
        sortOrder: block.sortOrder,
        editorState: block.editorState ?? null,
      }
    }

    if (block.mediaId?.trim()) {
      return {
        type: block.type,
        sortOrder: block.sortOrder,
        media: {
          kind: "existing" as const,
          mediaId: block.mediaId.trim(),
        },
        editorState: block.editorState ?? null,
      }
    }

    const uploaded = uploadedMediaBySortOrder.get(uploadedMediaIndex)
    uploadedMediaIndex += 1

    if (!uploaded) {
      return {
        type: block.type,
        sortOrder: block.sortOrder,
        media: {
          kind: "existing" as const,
          mediaId: "",
        },
        editorState: block.editorState ?? null,
      }
    }

    return {
      type: block.type,
      sortOrder: block.sortOrder,
      media: {
        kind: "uploaded" as const,
        uploaded,
      },
      editorState: block.editorState ?? null,
    }
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
  files,
  blocks = [],
}: CreatePostWithMediaWorkflowInput) {
  const resolvedPrice = visibility === "paid" ? price : 0

  const { data: creatorRow, error: creatorRowError } = await supabaseAdmin
    .from("creators")
    .select("user_id")
    .eq("id", creatorId)
    .single()

  if (creatorRowError) {
    throw creatorRowError
  }

  if (!creatorRow?.user_id) {
    throw new Error("Creator user not found")
  }

  const hasIncomingBlocks = blocks.length > 0

  const projectedDraft = hasIncomingBlocks
    ? projectCreatePostDraft({
        blocks: buildCreateDraftBlocksFromLegacyInput({
          blocks,
          files,
        }),
      })
    : null

  const resolvedContent = hasIncomingBlocks
    ? projectedDraft?.content ?? null
    : content?.trim() ?? null

  const moderationFiles = hasIncomingBlocks
    ? projectedDraft?.media.map((item) => item.uploaded) ?? []
    : files

  console.log(
    "[createPostWithMediaWorkflow] files",
    moderationFiles.map((file) => ({
      name: file.originalName,
      type: file.type,
      size: file.size,
      path: file.path,
    }))
  )

  const hasVideo = moderationFiles.some(
    (file) => resolveUploadedMediaType(file.type) === "video"
  )

  console.log("[createPostWithMediaWorkflow] hasVideo", hasVideo)

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

  const media: CreatedMedia[] = []
  const blocksToInsert: CreatePostBlockInput[] = []

  if (hasIncomingBlocks && projectedDraft) {
    for (const mediaItem of projectedDraft.media) {
      const type = resolveUploadedMediaType(mediaItem.uploaded.type)

      console.log("[createPostWithMediaWorkflow] detected media type", {
        name: mediaItem.uploaded.originalName,
        fileType: mediaItem.uploaded.mimeType,
        detectedType: type,
        path: mediaItem.uploaded.path,
      })

      const mediaRow = await createMedia({
        postId: post.id,
        ownerUserId: creatorRow.user_id,
        type,
        storagePath: mediaItem.uploaded.path,
        mimeType: mediaItem.uploaded.mimeType || undefined,
        sortOrder: mediaItem.sortOrder,
        useInitialModerationState: true,
      })

      media.push({
        id: mediaRow.id,
        type: mediaRow.type,
        storagePath: mediaRow.storagePath,
      })
    }

    const mediaIdBySortOrder = new Map<number, string>(
      media.map((item, index) => [projectedDraft.media[index].sortOrder, item.id])
    )

    blocksToInsert.push(
      ...projectedDraft.blocks
        .map((block) => {
          if (block.type === "text") {
            return block
          }

          return {
            ...block,
            mediaId: block.mediaId ?? mediaIdBySortOrder.get(block.sortOrder) ?? null,
          }
        })
        .filter((block) => {
          if (block.type === "text") {
            return (block.content?.trim() ?? "").length > 0
          }

          return Boolean(block.mediaId)
        })
    )
  } else {
    for (const [index, file] of files.entries()) {
      const type = resolveUploadedMediaType(file.type)

      console.log("[createPostWithMediaWorkflow] detected media type", {
        name: file.originalName,
        fileType: file.mimeType,
        detectedType: type,
        path: file.path,
      })

      const mediaRow = await createMedia({
        postId: post.id,
        ownerUserId: creatorRow.user_id,
        type,
        storagePath: file.path,
        mimeType: file.mimeType || undefined,
        sortOrder: index,
        useInitialModerationState: true,
      })

      media.push({
        id: mediaRow.id,
        type: mediaRow.type,
        storagePath: mediaRow.storagePath,
      })
    }

    const trimmedContent = resolvedContent?.trim() ?? ""

    if (trimmedContent) {
      blocksToInsert.push({
        type: "text",
        content: trimmedContent,
        sortOrder: 0,
      })
    }

    media.forEach((item, index) => {
      blocksToInsert.push({
        type: item.type,
        mediaId: item.id,
        sortOrder: trimmedContent ? index + 1 : index,
      })
    })
  }

  await createPostBlocks(post.id, blocksToInsert)

  if (hasVideo) {
    console.log("🔥 CALL processVideoModeration", {
      postId: post.id,
      publishIntent: status === "scheduled" ? "scheduled" : "published",
      publishedAt,
      media,
    })

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