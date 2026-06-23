import { getAdminPaymentAnalytics } from "@/modules/payment/public/get-admin-payment-analytics"
import { getAnalytics } from "@/modules/payment/public/get-analytics"
import { getPlatformPaymentAnalytics } from "@/modules/payment/public/get-platform-payment-analytics"

export async function getCanonicalAdminCommerceAnalytics() {
  return getAnalytics()
}

export async function getCanonicalAdminPaymentAnalytics() {
  return getAdminPaymentAnalytics()
}

export async function getCanonicalPlatformPaymentAnalytics() {
  return getPlatformPaymentAnalytics()
}
