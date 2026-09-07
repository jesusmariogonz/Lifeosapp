"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@lifeos.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
      <div className="card w-full max-w-sm">
        <h1 className="font-serif text-3xl text-sage-600">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-light">Sign in to your Life OS.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
          <button onClick={() => signIn("google", { callbackUrl: "/" })} className="btn-secondary mt-3 w-full">
            Continue with Google
          </button>
        )}

        <p className="mt-6 text-center text-sm text-ink-light">
          No account?{" "}
          <Link href="/signup" className="text-sage-600 underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-light">
          Demo login: demo@lifeos.app / demo1234
        </p>
      </div>
    </div>
  );
}
