import Link from "next/link"
import { listUsers } from "@/modules/admin/server/list-users"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { toggleUserStatusAction } from "./actions"
import { toggleUserBanAction } from "./actions"

export default async function AdminUsersPage() {
  const users = await listUsers()

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="There are no users in the system."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Users
        </h1>
        <p className="text-sm text-zinc-500">
          Manage all platform users
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800">
              {users.map((user) => {
                const isDeactivated = user.is_deactivated
                const isBanned = user.is_banned

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-900/50 transition"
                  >
                    <td className="py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="block"
                      >
                        <div className="font-medium text-white hover:underline">
                          {user.display_name || user.username}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {user.id.slice(0, 8)}
                        </div>
                      </Link>
                    </td>

                    <td className="py-3 text-zinc-400">
                      {user.email}
                    </td>

                    <td className="py-3 space-y-1">
                      <StatusBadge
                        label={isDeactivated ? "deactivated" : "active"}
                      />
                      {isBanned && (
                        <StatusBadge label="banned" />
                      )}
                    </td>

                    <td className="py-3 space-y-2">
                      {/* Deactivate */}
                      <form action={toggleUserStatusAction}>
                        <input
                          type="hidden"
                          name="userId"
                          value={user.id}
                        />
                        <input
                          type="hidden"
                          name="deactivate"
                          value={(!isDeactivated).toString()}
                        />

                        <button
                          type="submit"
                          className={
                            isDeactivated
                              ? "rounded-xl bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                              : "rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                          }
                        >
                          {isDeactivated ? "Activate" : "Deactivate"}
                        </button>
                      </form>

                      {/* Ban */}
                      <form action={toggleUserBanAction}>
                        <input
                          type="hidden"
                          name="userId"
                          value={user.id}
                        />
                        <input
                          type="hidden"
                          name="ban"
                          value={(!isBanned).toString()}
                        />

                        <button
                          type="submit"
                          className={
                            isBanned
                              ? "rounded-xl bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                              : "rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                          }
                        >
                          {isBanned ? "Unban" : "Ban"}
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}