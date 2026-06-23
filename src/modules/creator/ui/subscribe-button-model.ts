export type SubscriptionCheckState = "active" | "ending" | "expired" | "inactive"

export type SubscriptionCheckResponse = {
  subscribed?: boolean
  cancelAtPeriodEnd?: boolean
  hasAccess?: boolean
  state?: SubscriptionCheckState
  isCancelScheduled?: boolean
}

export type CheckoutResponse = {
  payment?: {
    id?: string
    amount?: number
  }
  checkout?: {
    orderId?: string
    orderName?: string
  }
  error?: string
}

export function getSubscribeErrorMessage(message: string) {
  if (message === "You already have an active subscription") {
    return "이미 구독 중입니다"
  }

  if (message === "You cannot subscribe to your own creator page") {
    return "본인 페이지는 구독할 수 없습니다"
  }

  if (message === "Invalid subscription price") {
    return "구독 가격이 올바르지 않습니다"
  }

  if (message === "Creator not found") {
    return "페이지를 찾을 수 없습니다"
  }

  return "구독 처리에 실패했습니다"
}

export function resolveSubscriptionFlags(data: SubscriptionCheckResponse) {
  const state = data.state

  if (state) {
    return {
      subscribed: data.hasAccess ?? (state === "active" || state === "ending"),
      cancelAtPeriodEnd: data.isCancelScheduled ?? state === "ending",
    }
  }

  return {
    subscribed: Boolean(data.subscribed),
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
  }
}
