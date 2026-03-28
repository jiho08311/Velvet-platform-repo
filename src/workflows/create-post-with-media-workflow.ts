import { createPost } from "@/modules/post/server/create-post";
import { uploadMedia } from "@/modules/media/server/upload-media";
import { createMedia } from "@/modules/media/server/create-media";

type CreatePostWithMediaWorkflowInput = {
  creatorId: string;
  title?: string | null;
  content?: string | null;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "subscribers" | "paid";
  priceCents?: number;
  files: File[];
};

function getMediaType(file: File): "image" | "video" | "audio" | "file" {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return "file";
}

export async function createPostWithMediaWorkflow({
  creatorId,
  title,
  content,
  status = "draft",
  visibility = "subscribers",
  priceCents = 0,
  files,
}: CreatePostWithMediaWorkflowInput) {
  const resolvedPriceCents = visibility === "paid" ? priceCents : 0;

  const post = await createPost({
    creatorId,
    title,
    content,
    status,
    visibility,
    priceCents: resolvedPriceCents,
  });

  const media = [];

  for (const [index, file] of files.entries()) {
    const storagePath = await uploadMedia({
  uploaderUserId: creatorId,
  file,
});

    const mediaRow = await createMedia({
      postId: post.id,
      type: getMediaType(file),
      storagePath,
      mimeType: file.type || undefined,
      sortOrder: index,
      status: "ready",
    });

    media.push(mediaRow);
  }

  return {
    post,
    media,
  };
}