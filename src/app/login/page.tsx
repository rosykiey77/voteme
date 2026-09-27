"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartIcon, LockIcon, ShieldIcon, VoteIcon } from "@/components/icons";

const FEATURES = [
  { icon: LockIcon, text: "RFID disimpan sebagai hash" },
  { icon: VoteIcon, text: "Suara dipisah dari identitas" },
  { icon: ChartIcon, text: "Laporan real-time" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login gagal.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="panel w-full max-w-4xl grid md:grid-cols-2 overflow-hidden fade-in-up">
        {/* Kiri: branding */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-600/15 via-transparent to-amber-500/10 border-r border-[var(--border)]">
          <div>
            <div className="icon-tile icon-tile-info mb-4">
              <ShieldIcon size={20} />
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              Vote<span className="text-amber-400">Frame</span>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
              Sistem pemilihan karyawan berbasis RFID.
              <br />
              Suara anonim, hasil transparan.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-[var(--text-soft)]">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <Icon size={16} className="text-amber-300 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Kanan: form */}
        <div className="p-8 md:p-10">
          <div className="md:hidden text-2xl font-extrabold mb-6">
            Vote<span className="text-amber-400">Frame</span>
          </div>
          <h1 className="text-xl font-bold">Masuk sebagai Admin</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Panel pengelolaan event pemilihan.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="text-sm text-[var(--text-soft)]">
                Username
              </label>
              <input
                id="username"
                className="input mt-1.5"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm text-[var(--text-soft)]">
                Password
              </label>
              <input
                id="password"
                className="input mt-1.5"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-xs text-[var(--muted)]">
            Default: <code className="text-amber-300">admin / admin123</code> (ubah di file .env)
          </p>
        </div>
      </div>
    </main>
  );
}
