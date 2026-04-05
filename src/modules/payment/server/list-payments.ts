import { createSupabaseServerClient } from "@/infrastructure/supabase/server"

type PaymentRow = {
  id: string
  amount: number | null
  status: "succeeded" | "pending" | "failed" | "refunded"
  type: "subscription" | "tip" | "ppv_post" | "ppv_message" | null
  created_at: string
  user_id: string | null
  creator_id: string | null
  currency: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
}

type CreatorRow = {
  id: string
  user_id: string
  username: string | null
  display_name: string | null
}

export type AdminPaymentItem = {
  id: string
  amount: number
  currency: string
  status: "succeeded" | "pending" | "failed" | "refunded"
  paymentType: "subscription" | "tip" | "ppv_post" | "ppv_message" | "unknown"
  createdAt: string
  user: {
    username: string
    displayName: string
  } | null
  creator: {
    username: string
    displayName: string
  } | null
}

export async function listPayments(): Promise<AdminPaymentItem[]> {
  const supabase = await createSupabaseServerClient()

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      "id, amount, currency, status, type, created_at, user_id, creator_id"
    )
    .order("created_at", { ascending: false })
    .returns<PaymentRow[]>()

  if (paymentsError) {
    throw new Error(paymentsError.message)
  }

  const rows = payments ?? []

  const userIds = Array.from(
    new Set(rows.map((row) => row.user_id).filter(Boolean))
  ) as string[]

  const creatorIds = Array.from(
    new Set(rows.map((row) => row.creator_id).filter(Boolean))
  ) as string[]

  const [{ data: users, error: usersError }, { data: creators, error: creatorsError }] =
    await Promise.all([
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, username, display_name")
            .in("id", userIds)
            .returns<ProfileRow[]>()
        : Promise.resolve({ data: [], error: null }),
      creatorIds.length > 0
        ? supabase
            .from("creators")
            .select("id, user_id, username, display_name")
            .in("id", creatorIds)
            .returns<CreatorRow[]>()
        : Promise.resolve({ data: [], error: null }),
    ])

  if (usersError) {
    throw new Error(usersError.message)
  }

  if (creatorsError) {
    throw new Error(creatorsError.message)
  }

  const userMap = new Map((users ?? []).map((user) => [user.id, user]))
  const creatorMap = new Map((creators ?? []).map((creator) => [creator.id, creator]))

  return rows.map((row) => {
    const user = row.user_id ? userMap.get(row.user_id) : null
    const creator = row.creator_id ? creatorMap.get(row.creator_id) : null

    return {
      id: row.id,
      amount: row.amount ?? 0,
      currency: row.currency ?? "KRW",
      status: row.status,
      paymentType: row.type ?? "unknown",
      createdAt: row.created_at,
      user: user
        ? {
            username: user.username ?? "",
            displayName: user.display_name ?? user.username ?? "",
          }
        : null,
      creator: creator
        ? {
            username: creator.username ?? "",
            displayName: creator.display_name ?? creator.username ?? "",
          }
        : null,
    }
  })
}