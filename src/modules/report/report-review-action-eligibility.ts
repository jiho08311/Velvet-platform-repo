import type { ReportStatus } from "@/modules/report/types"

export type ReportReviewActionEligibilityPolicy = "strict"

export type ReportReviewActionEligibility = {
  policy: ReportReviewActionEligibilityPolicy
  canMarkReviewing: boolean
  canResolve: boolean
  canReject: boolean
}

export function getReportReviewActionEligibility(
  status: ReportStatus
): ReportReviewActionEligibility {
  switch (status) {
    case "pending":
      return {
        policy: "strict",
        canMarkReviewing: true,
        canResolve: true,
        canReject: true,
      }

    case "reviewing":
      return {
        policy: "strict",
        canMarkReviewing: false,
        canResolve: true,
        canReject: true,
      }

    case "resolved":
      return {
        policy: "strict",
        canMarkReviewing: false,
        canResolve: false,
        canReject: false,
      }

    case "rejected":
      return {
        policy: "strict",
        canMarkReviewing: false,
        canResolve: false,
        canReject: false,
      }

    default:
      return {
        policy: "strict",
        canMarkReviewing: false,
        canResolve: false,
        canReject: false,
      }
  }
}