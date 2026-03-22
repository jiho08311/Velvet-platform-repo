import { SignInForm } from "@/modules/auth/ui/SignInForm";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/30">
        <div className="border-b border-zinc-800 bg-gradient-to-r from-[#C2185B]/20 via-zinc-900/40 to-transparent px-8 py-6">
          <h1 className="text-center text-2xl font-semibold text-white">
            Sign in
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Access your creator account
          </p>
        </div>

        <div className="px-8 py-6">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}