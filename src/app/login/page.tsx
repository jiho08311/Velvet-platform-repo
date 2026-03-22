import { SignInForm } from "@/modules/auth/ui/SignInForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Login
        </h1>

        <SignInForm />
      </div>
    </main>
  );
}