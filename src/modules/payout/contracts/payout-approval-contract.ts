export type PayoutApprovalResult = {
  payoutRequestId: string
  payoutId: string
  creatorId: string
  amount: number
  currency: string
  status: "approved" | string
}
