export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"

export type PaymentResultPageReason =
  | "success"
  | "canceled"
  | "failed"
  | "invalid_request"
  | "verification_failed"

export type PaymentResultPageState = {
  reason: PaymentResultPageReason
  title: string
  message: string
  notice: string
  canUnlockAccess: boolean
}

const paymentResultPageMessages: Record<
  PaymentResultPageReason,
  Omit<PaymentResultPageState, "reason" | "canUnlockAccess">
> = {
  success: {
    title: "결제 처리 중이에요",
    message: "결제 확인을 진행하고 있어요. 잠시만 기다려 주세요.",
    notice: "완료되면 자동으로 반영돼요.",
  },
  canceled: {
    title: "결제가 취소되었어요",
    message: "결제가 취소되었어요.",
    notice:
      "결제를 진행하지 않으면 콘텐츠 접근이 제한될 수 있어요.",
  },
  failed: {
    title: "결제에 실패했어요",
    message: "결제 처리에 실패했어요.",
    notice:
      "문제가 계속되면 결제 수단, 네트워크 상태, 또는 중복 요청 여부를 확인해 주세요.",
  },
  invalid_request: {
    title: "결제에 실패했어요",
    message: "잘못된 결제 요청이에요.",
    notice:
      "문제가 계속되면 결제 수단, 네트워크 상태, 또는 중복 요청 여부를 확인해 주세요.",
  },
  verification_failed: {
    title: "결제에 실패했어요",
    message: "결제 검증에 실패했어요.",
    notice:
      "문제가 계속되면 결제 수단, 네트워크 상태, 또는 중복 요청 여부를 확인해 주세요.",
  },
}

function isPaymentResultPageReason(
  reason: string | null | undefined
): reason is PaymentResultPageReason {
  return (
    reason === "success" ||
    reason === "canceled" ||
    reason === "failed" ||
    reason === "invalid_request" ||
    reason === "verification_failed"
  )
}

export function isSuccessfulPaymentStatus(status: PaymentStatus): boolean {
  return status === "succeeded"
}

export function isTerminalFailedPaymentStatus(status: PaymentStatus): boolean {
  return status === "failed" || status === "refunded"
}

export function canPaymentUnlockAccess(status: PaymentStatus): boolean {
  return isSuccessfulPaymentStatus(status)
}

export function getPaymentResultPageState(
  reason: string | null | undefined
): PaymentResultPageState {
  const safeReason = isPaymentResultPageReason(reason) ? reason : "failed"
  const state = paymentResultPageMessages[safeReason]

  return {
    reason: safeReason,
    ...state,
    canUnlockAccess: safeReason === "success",
  }
}
