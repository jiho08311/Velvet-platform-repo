import { createClient } from "@/infrastructure/supabase/server";

export type AdminPayoutRequestListItem = {
  id: string;
  creator_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  creator_username: string | null;
  creator_display_name: string | null;
};

export async function listPayoutRequests(): Promise<AdminPayoutRequestListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payout_requests")
    .select(`
      id,
      creator_id,
      amount,
      currency,
      status,
      created_at,
      approved_at,
      rejected_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items: AdminPayoutRequestListItem[] = (data ?? []).map((item) => ({
    id: item.id,
    creator_id: item.creator_id,
    amount: Number(item.amount ?? 0),
    currency: item.currency ?? "KRW",
    status: item.status,
    created_at: item.created_at,
    approved_at: item.approved_at ?? null,
    rejected_at: item.rejected_at ?? null,
    creator_username: null,
    creator_display_name: null,
  }));

  return items.sort((a, b) => {
    const aPending = a.status === "pending" ? 0 : 1;
    const bPending = b.status === "pending" ? 0 : 1;

    if (aPending !== bPending) {
      return aPending - bPending;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}