import type { PayoutExecutionLifecycleState } from "@/modules/payout/lib/resolve-payout-state"

export function getPayoutExecutionLabel(
  lifecycleState: PayoutExecutionLifecycleState
): string {
  if (lifecycleState === "paid") {
    return "지급 완료"
  }

  if (lifecycleState === "failed") {
    return "지급 실패"
  }

  return "처리 중"
}