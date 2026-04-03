"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn.email({
        email: form.email,
        password: form.password,
        callbackURL: "/profile",
      });
      if (res?.error) throw new Error(res.error.message);
      router.push("/profile");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () =>
    signIn.social({ provider: "google", callbackURL: "/profile" });

  return (
    <>
      <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight mb-1">
        Welcome back
      </h2>
      <p className="text-[13px] text-slate-400 mb-6">
        Sign in to your MediLife account
      </p>

      {/* Google */}
      <button
        onClick={handleGoogle}
        type="button"
        className="w-full flex items-center justify-center gap-2.5 py-[11px] px-4 bg-white border-[1.5px] border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-[10px] text-[13px] font-medium text-slate-600 transition-all cursor-pointer mb-5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[11px] font-semibold text-slate-300 tracking-wider">OR</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg px-4 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.4px] mb-1.5">
            Email
          </label>
          <input
            type="email" placeholder="you@example.com" required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-3.5 py-[11px] bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] text-slate-900 placeholder-slate-300 outline-none focus:border-slate-900 focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,23,42,0.04)] transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[0.4px] mb-1.5">
            Password
          </label>
          <input
            type="password" placeholder="••••••••" required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full px-3.5 py-[11px] bg-slate-50 border-[1.5px] border-slate-200 rounded-[10px] text-[13px] text-slate-900 placeholder-slate-300 outline-none focus:border-slate-900 focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,23,42,0.04)] transition-all"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-3 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white text-[13px] font-semibold rounded-[10px] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.2)] active:translate-y-0 cursor-pointer mt-1"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-[12px] text-slate-400 mt-5">
        No account?{" "}
        <Link href="/sign-up" className="text-slate-900 font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}