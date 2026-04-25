import type { CreateNotificationInput } from "../types"
import type { MessageSentEvent } from "@/modules/message/types"

type NotificationInputPayloadByType = {
  subscription_started: {
    subscriptionId: string
  }
  subscription_canceled: {
    creatorId: string
    subscriberId: string
    subscriptionId: string
  }
  payment_succeeded: {
    paymentId: string
  }
  ppv_message_purchased: {
    paymentId: string
  }
  ppv_post_purchased: {
    paymentId: string
    buyerId?: string
    postId?: string
  }
  post_liked: {
    postId: string
    creatorId: string
  }
  comment_created: {
    postId: string
    commentId: string
    creatorId: string
  }
  comment_liked: {
    postId: string
    commentId: string
  }
  message_received: {
    conversationId: string
    messageId: string
  }
}

function createNotificationInput<TType extends keyof NotificationInputPayloadByType>(
  input: {
    userId: string
    type: TType
    title: string
    body: string
    data: NotificationInputPayloadByType[TType]
  },
): CreateNotificationInput {
  return {
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data,
  }
}

export function createSubscriptionStartedNotificationInput(input: {
  userId: string
  subscriptionId: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "subscription_started",
    title: "New subscriber",
    body: "You have a new subscriber.",
    data: {
      subscriptionId: input.subscriptionId,
    },
  })
}

export function createSubscriptionCanceledNotificationInput(input: {
  userId: string
  creatorId: string
  subscriberId: string
  subscriptionId: string
  mode: "period_end" | "immediate"
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "subscription_canceled",
    title:
      input.mode === "period_end"
        ? "Subscription cancellation scheduled"
        : "Subscription canceled",
    body:
      input.mode === "period_end"
        ? "A subscriber scheduled cancellation at period end."
        : "A subscriber canceled their subscription immediately.",
    data: {
      creatorId: input.creatorId,
      subscriberId: input.subscriberId,
      subscriptionId: input.subscriptionId,
    },
  })
}

export function createPaymentSucceededNotificationInput(input: {
  userId: string
  paymentId: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "payment_succeeded",
    title: "Payment successful",
    body: "Your payment was completed successfully.",
    data: {
      paymentId: input.paymentId,
    },
  })
}

export function createPpvMessagePurchasedNotificationInput(input: {
  userId: string
  paymentId: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "ppv_message_purchased",
    title: "PPV purchased",
    body: "A user purchased your PPV message.",
    data: {
      paymentId: input.paymentId,
    },
  })
}

export function createPpvPostPurchasedNotificationInput(input: {
  userId: string
  paymentId: string
  buyerId?: string
  postId?: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "ppv_post_purchased",
    title: "Content unlocked",
    body: "A user unlocked your content.",
    data: {
      paymentId: input.paymentId,
      buyerId: input.buyerId,
      postId: input.postId,
    },
  })
}

export function createPostLikedNotificationInput(input: {
  userId: string
  postId: string
  creatorId: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "post_liked",
    title: "Post liked",
    body: "Someone liked your post",
    data: {
      postId: input.postId,
      creatorId: input.creatorId,
    },
  })
}

export function createCommentCreatedNotificationInput(input: {
  userId: string
  postId: string
  commentId: string
  creatorId: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "comment_created",
    title: "New comment",
    body: "Someone commented on your post",
    data: {
      postId: input.postId,
      commentId: input.commentId,
      creatorId: input.creatorId,
    },
  })
}

export function createCommentLikedNotificationInput(input: {
  userId: string
  postId: string
  commentId: string
}): CreateNotificationInput {
  return createNotificationInput({
    userId: input.userId,
    type: "comment_liked",
    title: "Comment liked",
    body: "Someone liked your comment",
    data: {
      postId: input.postId,
      commentId: input.commentId,
    },
  })
}

export function createMessageReceivedNotificationInput(
  event: MessageSentEvent,
): CreateNotificationInput {
  return createNotificationInput({
    userId: event.recipientUserId,
    type: "message_received",
    title: "New message",
    body: "새로운 메시지가 도착했어요",
    data: {
      conversationId: event.conversationId,
      messageId: event.messageId,
    },
  })
}
