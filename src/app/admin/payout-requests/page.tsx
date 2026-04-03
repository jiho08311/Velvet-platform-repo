import { PayoutRequestAdminList } from "@/modules/admin/ui/PayoutRequestAdminList";
import { listPayoutRequests } from "@/modules/admin/server/list-payout-requests";

export default async function AdminPayoutRequestsPage() {
  const items = await listPayoutRequests();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Payout Requests</h1>
        <p className="mt-2 text-sm text-zinc-400">
          크리에이터 출금 요청을 확인하고 승인할 수 있습니다.
        </p>
      </div>

      <PayoutRequestAdminList items={items} />
    </main>
  );
}