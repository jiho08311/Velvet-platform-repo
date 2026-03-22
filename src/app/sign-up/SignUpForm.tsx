"use client";

import { useState } from "react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log("sign up response", data);

    if (!response.ok) {
      alert(data.error || "Sign up failed");
      return;
    }

    // 👉 회원가입 성공 → 바로 로그인 페이지 이동
    window.location.href = "/sign-in";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm text-zinc-200">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-zinc-200">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-white py-3 text-black font-medium"
      >
        Sign up
      </button>
    </form>
  );
}