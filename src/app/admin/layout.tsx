import { redirect } from "next/navigation"
import { requireAdmin } from "@/modules/admin/server/require-admin"
import { AdminSidebar } from "./_components/AdminSidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch {
    redirect("/feed")
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <AdminSidebar />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}