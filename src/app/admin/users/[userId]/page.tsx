import { getUserDetail } from "@/modules/admin/server/get-user-detail"
import { Card } from "@/shared/ui/Card"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type Props = {
  params: {
    userId: string
  }
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { profile, creator } = await getUserDetail({
    userId: params.userId,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          User Detail
        </h1>
        <p className="text-sm text-zinc-500">
          Inspect user information
        </p>
      </div>

      <Card>
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">User ID</p>
          <p className="text-white">{profile.id}</p>

          <p className="text-sm text-zinc-500 mt-4">Email</p>
          <p className="text-white">{profile.email}</p>

          <p className="text-sm text-zinc-500 mt-4">Username</p>
          <p className="text-white">{profile.username}</p>

          <p className="text-sm text-zinc-500 mt-4">Status</p>
          <StatusBadge
            label={profile.is_deactivated ? "deactivated" : "active"}
          />
        </div>
      </Card>

      <Card>
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">Creator</p>

          {creator ? (
            <>
              <StatusBadge label={creator.status} />
              <p className="text-white mt-2">
              Subscription: ₩{creator.subscription_price}
              </p>
            </>
          ) : (
            <p className="text-zinc-500">Not a creator</p>
          )}
        </div>
      </Card>
    </div>
  )
}