import type { CommerceContext, Money, PaymentState } from "./types"

import { getPaymentUseCase } from "@/modules/commerce/application/payment/get-payment-use-case"

import { confirmPaymentUseCase } from "@/modules/commerce/application/payment/confirm-payment-use-case"

export async function confirmPayment(
  input: ConfirmPaymentInput
): Promise<ConfirmPaymentResult> {
  return confirmPaymentUseCase(input)
}

import { createCheckoutUseCase } from "@/modules/commerce/application/payment/create-checkout-use-case"

export async function createCheckout(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult> {
  return createCheckoutUseCase(input)
}


import { failPaymentUseCase } from "@/modules/commerce/application/payment/fail-payment-use-case"

export async function failPayment(
  input: FailPaymentInput
): Promise<FailPaymentResult> {
  return failPaymentUseCase(input)
}


import { refundPaymentUseCase } from "@/modules/commerce/application/payment/refund-payment-use-case"

export async function refundPayment(
  input: RefundPaymentInput
): Promise<RefundPaymentResult> {
  return refundPaymentUseCase(input)
}

import { listCanonicalPayments } from "@/modules/commerce/internal/adapters/payment-query-adapter"

export async function listCommercePayments() {
  return listCanonicalPayments()
}

import { listCanonicalCreatorPayments } from "@/modules/commerce/internal/adapters/payment-query-adapter"

export async function listCommerceCreatorPayments(input: {
  creatorId: string
}) {
  return listCanonicalCreatorPayments(input)
}

export async function getPaymentById(
  input: GetPaymentInput
): Promise<GetPaymentResult> {
  return getPaymentUseCase(input)
}

export type CreateCheckoutInput = {
  payerUserId: string
  creatorId?: string | null
  purpose: PaymentState["purpose"]
  money: Money
  target?: PaymentState["target"]
  provider?: PaymentState["provider"]
  providerReferenceId?: string
  orderId: string
  orderName: string
  customerEmail?: string
  successUrl: string
  failUrl: string
  context?: CommerceContext
}

export type CreateCheckoutResult = {
  payment: PaymentState
  checkout: {
    provider: PaymentState["provider"]
    url: string | null
    providerReferenceId: string | null
  }
}

export type ConfirmPaymentInput = {
  paymentId: string
  paymentKey?: string
  orderId?: string
  amount?: number
  context?: CommerceContext
}

export type ConfirmPaymentResult = {
  payment: PaymentState & { status: "succeeded"; confirmedAt: string }
  idempotency: { duplicateDetected: boolean }
  effects: {
    subscriptionActivation: "not_applicable" | "scheduled" | "completed" | "failed"
    earningCreation: "not_applicable" | "scheduled" | "completed" | "failed"
    notification: "not_applicable" | "scheduled" | "completed" | "failed"
  }
}

export type FailPaymentInput = {
  paymentId: string
  failureReason: string
  context?: CommerceContext
}

export type FailPaymentResult = {
  payment: PaymentState & { status: "failed"; failedAt: string }
  failureReason: string
}

export type RefundPaymentInput = {
  paymentId: string
  reason?: string
  context?: CommerceContext
}

export type RefundPaymentResult = {
  payment: PaymentState & { status: "refunded"; refundedAt: string }
  effects: {
    earningReversal:
      | "not_applicable"
      | "completed"
      | "already_reversed"
      | "blocked_paid_out"
      | "failed"
    subscriptionExpiry: "not_applicable" | "completed" | "failed"
  }
}

export type GetPaymentInput = {
  paymentId: string
}

export type GetPaymentResult = {
  payment: PaymentState | null
}

