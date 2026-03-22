import { getPostById } from "./get-post-by-id";
import { isSubscribed } from "@/modules/subscription/server/is-subscribed";
import { hasPurchasedPost } from "@/modules/payment/server/has-purchased-post";
import { canViewPost } from "./can-view-post";
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id";

type GetPostAccessInput = {
  postId: string;
  viewerUserId?: string | null;
};

export async function getPostAccess({
  postId,
  viewerUserId,
}: GetPostAccessInput) {
  const post = await getPostById(postId);

  if (!post) {
    return {
      canView: false,
      post: null,
    };
  }

  const creator = await getCreatorById(post.creatorId);

  if (!creator) {
    return {
      canView: false,
      post: null,
    };
  }

  let isSubscribedResult = false;
  let hasPurchasedResult = false;

  if (viewerUserId) {
    isSubscribedResult = await isSubscribed({
      userId: viewerUserId,
      creatorId: post.creatorId,
    });

    if (post.priceCents !== null) {
      hasPurchasedResult = await hasPurchasedPost({
        userId: viewerUserId,
        postId: post.id,
      });
    }
  }

  const canView = canViewPost({
    viewerUserId: viewerUserId ?? null,
    post: {
      id: post.id,
      creatorId: post.creatorId,
      text: post.content ?? "",
      visibility: post.visibility,
      isLocked: false,
      price: post.priceCents,
      createdAt: post.createdAt,
    },
    creatorUserId: creator.userId,
    isSubscribed: isSubscribedResult,
    hasPurchased: hasPurchasedResult,
  });

  return {
    canView,
    post,
  };
}