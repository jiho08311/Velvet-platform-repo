import { listAdminUsers } from "@/modules/admin/server/list-admin-users"
import { Card } from "@/shared/ui/Card"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { EmptyState } from "@/shared/ui/EmptyState"
import { requireAdmin } from "@/modules/admin/server/require-admin"

export default async function AdminAdminsPage() {
  await requireAdmin({ roles: ["super_admin"] })

  const admins = await listAdminUsers()

  if (admins.length === 0) {
    return (
      <EmptyState
        title="No admins"
        description="No admin users found."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Admin Users
        </h1>
        <p className="text-sm text-zinc-500">
          Manage admin roles
        </p>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="pb-3">User</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
           {admins.map((item) => {
  const user = item.profile

  if (!user) return null

  return (
    <tr key={user.id}>
      <td className="py-3 text-white">
        {user.display_name || user.username}
      </td>

      <td className="py-3 text-zinc-400">
        {user.email}
      </td>

      <td className="py-3">
        <StatusBadge label={item.role} />
      </td>
    </tr>
  )
})}
          </tbody>
        </table>
      </Card>
    </div>
  )
}