"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";

type PositionResult = {
  id: string;
  name: string;
  totalVotes: number;
  leadingIds: string[];
  candidates: { id: string; number: number; name: string; votes: number }[];
};
type Results = {
  event: { id: string; slug: string; name: string; description: string; status: string };
  participation: { totalParticipants: number; voted: number; turnoutPct: number };
  positions: PositionResult[];
};

/** Papan hasil publik per event: /results/<slug> — hanya agregat anonim. */
export default function PublicResultsEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [results, setResults] = useState<Results | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = () =>
      fetch(`/api/results/by-slug/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) setNotFound(true);
          else setResults(d);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [slug]);

  if (notFound) {
    return (
      <main className="min-h-screen grid place-items-center p-4">
        <div className="panel p-8 text-center max-w-md">
          <div className="icon-tile icon-tile-info mx-auto mb-3" style={{ width: 52, height: 52 }}>
            <SearchIcon size={26} />
          </div>
          <h1 className="text-lg font-bold">Papan hasil tidak ditemukan</h1>
          <Link href="/results" className="btn btn-ghost mt-5">
            ← Lihat semua sesi
          </Link>
        </div>
      </main>
    );
  }

  if (!results) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p className="text-[var(--muted)]">Memuat…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">
            Vote<span className="text-amber-400">Frame</span>
          </div>
          <h1 className="text-xl font-bold mt-1">{results.event.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            Hasil diperbarui otomatis setiap 10 detik • status: {results.event.status === "ACTIVE" ? "sedang berlangsung" : results.event.status === "CLOSED" ? "selesai" : "belum dibuka"}
          </p>
        </div>
        <div className="text-xs font-mono text-amber-300/80">/results/{results.event.slug}</div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="panel p-5 text-center">
          <div className="text-3xl font-extrabold">{results.participation.totalParticipants}</div>
          <div className="text-sm text-[var(--muted)]">Peserta</div>
        </div>
        <div className="panel p-5 text-center">
          <div className="text-3xl font-extrabold text-green-300">{results.participation.voted}</div>
          <div className="text-sm text-[var(--muted)]">Sudah Vote</div>
        </div>
        <div className="panel p-5 text-center">
          <div className="text-3xl font-extrabold text-amber-300">{results.participation.turnoutPct}%</div>
          <div className="text-sm text-[var(--muted)]">Partisipasi</div>
        </div>
      </div>

      <div className="space-y-6">
        {results.positions.map((pos) => (
          <section key={pos.id} className="panel p-6">
            <h2 className="font-semibold text-lg mb-4">{pos.name}</h2>
            <div className="space-y-4">
              {pos.candidates.map((c) => {
                const pct = pos.totalVotes > 0 ? Math.round((c.votes / pos.totalVotes) * 100) : 0;
                const leading = pos.leadingIds.includes(c.id);
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2.5">
                        <span className="inline-grid place-items-center w-8 h-8 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-bold">
                          {c.number}
                        </span>
                        <b>{c.name}</b>
                        {leading && <span className="badge badge-active">unggul</span>}
                      </span>
                      <span className="font-mono text-[var(--muted)]">
                        {c.votes} • {pct}%
                      </span>
                    </div>
                    <div className="h-4 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          leading ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-blue-600 to-blue-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {pos.candidates.length === 0 && <p className="text-sm text-[var(--muted)]">Belum ada kandidat.</p>}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-10 text-center text-xs text-[var(--muted)]">
        <Link href={`/vote/${results.event.slug}`} className="hover:text-amber-300">
          Buka halaman voting sesi ini →
        </Link>
      </footer>
    </main>
  );
}
