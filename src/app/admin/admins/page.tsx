import Link from "next/link"

import { requireAdmin } from "@/modules/admin/server/require-admin"
import { AdminEmptyState } from "@/modules/admin/ui/AdminEmptyState"
import { AdminSectionCard } from "@/modules/admin/ui/AdminSectionCard"
import { AdminStatCard } from "@/modules/admin/ui/AdminStatCard"
import { listUsers } from "@/modules/admin/server/list-users"
import { listCreators } from "@/modules/admin/server/list-creators"
import { listPayoutRequests } from "@/modules/admin/server/list-payout-requests"
import { listPayments } from "@/modules/payment/server/list-payments"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

function formatCurrency(amount: number, currency = "KRW") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [
    users,
    creators,
    payoutRequests,
    payments,
    activeSubscriptionsCountResult,
  ] = await Promise.all([
    listUsers({ limit: 5 }),
    listCreators(),
    listPayoutRequests(),
    listPayments(),
    supabaseAdmin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ])

  const totalUsers = users.length
  const totalCreators = creators.length
  const pendingPayoutRequests = payoutRequests.filter(
    (item) => item.status === "pending"
  ).length
  const activeSubscriptions = activeSubscriptionsCountResult.count ?? 0

  const recentUsers = users.slice(0, 5)
  const recentCreators = creators.slice(0, 5)
  const recentPayments = payments.slice(0, 5)

  const monthlyRevenue = recentPayments.reduce((sum, payment) => {
    const amount = Number(
      String(payment.amount).replace(/[^0-9.-]/g, "") || "0"
    )

    if (!Number.isFinite(amount)) {
      return sum
    }

    return payment.status === "succeeded" ? sum + amount : sum
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
        <p className="text-sm text-zinc-500">
          서비스 상태와 운영 작업을 한눈에 확인하세요
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Recent Users"
          value={totalUsers}
          helperText="최근 조회된 사용자 수"
        />
        <AdminStatCard
          label="Creators"
          value={totalCreators}
          helperText="현재 등록된 크리에이터 수"
        />
        <AdminStatCard
          label="Active Subscriptions"
          value={activeSubscriptions}
          helperText="현재 active subscription"
        />
        <AdminStatCard
          label="Pending Payout Requests"
          value={pendingPayoutRequests}
          helperText="확인이 필요한 출금 요청"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminSectionCard
          title="Quick Actions"
          description="자주 확인하는 운영 페이지로 바로 이동합니다"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/payout-requests"
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 transition hover:bg-zinc-900"
            >
              <p className="text-sm text-zinc-400">Payout</p>
              <p className="mt-1 text-base font-semibold text-white">
                Payout Requests
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                출금 요청 검토 및 승인
              </p>
            </Link>

            <Link
              href="/admin/admins"
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 transition hover:bg-zinc-900"
            >
              <p className="text-sm text-zinc-400">Admin</p>
              <p className="mt-1 text-base font-semibold text-white">
                Admin Users
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                관리자 계정 및 역할 확인
              </p>
            </Link>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Revenue Snapshot"
          description="최근 payment 데이터 기준 간단 요약"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-sm text-zinc-400">Recent Successful Revenue</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatCurrency(monthlyRevenue, "KRW")}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              현재 payment 목록 기준 표시
            </p>
          </div>
        </AdminSectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminSectionCard
          title="Recent Users"
          description="최근 생성된 사용자"
        >
          {recentUsers.length === 0 ? (
            <AdminEmptyState message="표시할 사용자가 없습니다." />
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.display_name || user.username || "Unknown user"}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {user.email || "@unknown"}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs text-zinc-500">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </AdminSectionCard>

        <AdminSectionCard
          title="Recent Creators"
          description="최근 등록된 크리에이터"
        >
          {recentCreators.length === 0 ? (
            <AdminEmptyState message="표시할 크리에이터가 없습니다." />
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      @{creator.username}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {creator.userId}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs text-zinc-500">
                    {formatDate(creator.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </AdminSectionCard>
      </section>

      <AdminSectionCard
        title="Pending Payout Requests"
        description="우선 확인이 필요한 출금 요청"
      >
        {pendingPayoutRequests === 0 ? (
          <AdminEmptyState message="대기 중인 payout request가 없습니다." />
        ) : (
          <div className="divide-y divide-zinc-800">
            {payoutRequests
              .filter((item) => item.status === "pending")
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {item.creator_display_name ||
                        item.creator_username ||
                        item.creator_id}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {item.id}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(item.amount, item.currency || "KRW")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </AdminSectionCard>
    </div>
  )
}