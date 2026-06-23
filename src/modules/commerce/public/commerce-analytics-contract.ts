import { getDashboardCommerceOverviewUseCase } from "@/modules/commerce/application/analytics/get-dashboard-commerce-overview-use-case"

import type { Money } from "./types"


import { getCanonicalAdminCommerceAnalytics } from "@/modules/commerce/internal/adapters/admin-commerce-analytics-adapter"

export async function getAdminCommerceAnalytics() {
  return getCanonicalAdminCommerceAnalytics()
}

import {
  getCanonicalAdminPaymentAnalytics,
  getCanonicalPlatformPaymentAnalytics,
} from "@/modules/commerce/internal/adapters/admin-commerce-analytics-adapter"

export async function getAdminPaymentAnalyticsReadModel() {
  return getCanonicalAdminPaymentAnalytics()
}

import {
  countCanonicalCreatorActiveSubscriptions,
  countCanonicalCreatorSubscriptions,
  listCanonicalCreatorAnalyticsPayments,
} from "@/modules/commerce/internal/adapters/commerce-analytics-adapter"

export async function listCreatorAnalyticsPaymentsReadModel(input: {
  creatorId: string
  periodStart: string
}) {
  return listCanonicalCreatorAnalyticsPayments(input)
}

export async function countCreatorSubscriptionsReadModel(creatorId: string) {
  return countCanonicalCreatorSubscriptions(creatorId)
}

export async function countCreatorActiveSubscriptionsReadModel(
  creatorId: string
) {
  return countCanonicalCreatorActiveSubscriptions(creatorId)
}



export async function getPlatformPaymentAnalyticsReadModel() {
  return getCanonicalPlatformPaymentAnalytics()
}

export async function getDashboardCommerceOverview(
  input: DashboardCommerceOverviewInput
): Promise<DashboardCommerceOverview> {
  return getDashboardCommerceOverviewUseCase(input)
}

export type CreatorCommerceAnalyticsInput = {
  creatorId: string
}

export type CreatorCommerceAnalytics = {
  creatorId: string
  revenue: {
    gross: Money
    net: Money
    platformFee: Money
  }
  payments: {
    succeededCount: number
    refundedCount: number
    failedCount: number
  }
  subscriptions: {
    activeCount: number
    endingCount: number
    expiredCount: number
  }
  payouts: {
    requested: Money
    paid: Money
    failedCount: number
  }
}

export type PlatformCommerceAnalyticsInput = {
  currency?: "KRW"
}

export type PlatformCommerceAnalytics = {
  revenue: {
    gross: Money
    net: Money
    platformFee: Money
  }
  payments: {
    totalCount: number
    succeededCount: number
    refundedCount: number
    failedCount: number
  }
  subscriptions: {
    activeCount: number
  }
  payouts: {
    pendingCount: number
    paidCount: number
    failedCount: number
  }
}

export type AdminCommerceAnalyticsInput = {
  currency?: "KRW"
}

export type AdminCommerceAnalytics = PlatformCommerceAnalytics

export type DashboardCommerceOverviewInput = {
  creatorId: string
}

export type DashboardCommerceOverview = {
  creatorId: string
  revenue: {
    gross: Money
    monthlyGross: Money
    net: Money
    platformFee: Money
  }
  payments: {
    recentCount: number
    succeededCount: number
  }
  subscriptions: {
    activeCount: number
    endingCount: number
  }
  payouts: {
    pendingAmount: Money
    paidAmount: Money
  }
}