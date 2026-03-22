export default async function AdminUsersPage() {
  const users: {
    id: string
    email: string
    username: string
    role: string
    status: string
    createdAt: string
  }[] = []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 text-white">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-2 text-sm text-white/60">
          View and manage platform users.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-base font-medium text-white">No users found</p>
            <p className="mt-2 text-sm text-white/60">
              Users will appear here once they sign up.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_160px_120px_120px_200px] gap-4 border-b border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/50">
              <span>Email</span>
              <span>Username</span>
              <span>Role</span>
              <span>Status</span>
              <span>Created</span>
            </div>

            <ul className="divide-y divide-white/10">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="grid grid-cols-[1fr_160px_120px_120px_200px] items-center gap-4 px-5 py-4"
                >
                  <span>{user.email}</span>
                  <span>{user.username}</span>
                  <span className="text-sm text-white/70">{user.role}</span>
                  <span className="text-sm text-white/70">{user.status}</span>
                  <span className="text-sm text-white/60">
                    {new Date(user.createdAt).toLocaleString()}
                  </span>

                  <div className="col-span-full mt-2 flex gap-2">
                    <button className="rounded-lg border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
                      Ban
                    </button>
                    <button className="rounded-lg border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
                      Unban
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  )
}