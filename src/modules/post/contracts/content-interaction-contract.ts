export type CanonicalPostComment = {
  id: string
  postId: string
  userId: string
  content: string
  createdAt: string
  deletedAt: string | null
}

export type CanonicalPostInteraction =
  | {
      type: "post_liked"
      postId: string
      userId: string
      occurredAt: string
    }
  | {
      type: "post_unliked"
      postId: string
      userId: string
      occurredAt: string
    }
  | {
      type: "comment_liked"
      commentId: string
      userId: string
      occurredAt: string
    }
  | {
      type: "comment_unliked"
      commentId: string
      userId: string
      occurredAt: string
    }
  | {
      type: "post_bookmarked"
      postId: string
      userId: string
      occurredAt: string
    }
  | {
      type: "post_unbookmarked"
      postId: string
      userId: string
      occurredAt: string
    }

export type CanonicalPostInteractionCounts = {
  postId: string
  likesCount: number
  commentsCount: number
  bookmarksCount: number
}