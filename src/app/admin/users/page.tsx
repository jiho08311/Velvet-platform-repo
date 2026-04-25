import Link from "next/link"
import { requireAdmin } from "@/modules/admin/server/require-admin"
import { getAdminUserIdSet } from "@/modules/admin/server/admin-role-policy"
import { resolveAdminUserManagementState } from "@/modules/admin/lib/admin-user-operational-policy"
import { listUsers } from "@/modules/admin/server/list-users"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { toggleUserStatusAction } from "./actions"
import { toggleUserBanAction } from "./actions"

export default async function AdminUsersPage() {
  const { user: currentAdmin } = await requireAdmin()
  const users = await listUsers()
  const adminUserIdSet = await getAdminUserIdSet()

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
                const managementState = resolveAdminUserManagementState({
                  userId: user.id,
                  currentAdminId: currentAdmin.id,
                  adminUserIdSet,
                })

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
                          {user.displayName || user.username}
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
                      {user.statusBadges.map((badge) => (
                        <StatusBadge key={badge.label} label={badge.label} />
                      ))}
                      {managementState.managementBadges.map((badge) => (
                        <StatusBadge key={badge.label} label={badge.label} />
                      ))}
                    </td>

                    <td className="py-3 space-y-2">
                      {managementState.canManage ? (
                        <>
                          <form action={toggleUserStatusAction}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input
                              type="hidden"
                              name="deactivate"
                              value={(!user.isDeactivated).toString()}
                            />

                            <button
                              type="submit"
                              className={
                                user.isDeactivated
                                  ? "rounded-xl bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                                  : "rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                              }
                            >
                              {user.isDeactivated ? "Activate" : "Deactivate"}
                            </button>
                          </form>

                          <form action={toggleUserBanAction}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input
                              type="hidden"
                              name="ban"
                              value={(!user.isBanned).toString()}
                            />

                            <button
                              type="submit"
                              className={
                                user.isBanned
                                  ? "rounded-xl bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                                  : "rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                              }
                            >
                              {user.isBanned ? "Unban" : "Ban"}
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          Not allowed
                        </span>
                      )}
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
