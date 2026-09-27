"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EventOption = { id: string; slug: string; name: string; description: string };

/** Daftar event aktif untuk papan hasil; tiap event punya URL sendiri. */
export default function ResultsChooserPage() {
  const [events, setEvents] = useState<EventOption[] | null>(null);

  useEffect(() => {
    fetch("/api/vote/events")
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="text-2xl font-extrabold tracking-tight">
          Vote<span className="text-amber-400">Frame</span>
        </div>
        <h1 className="text-xl font-bold mt-1">Papan Hasil</h1>
        <p className="text-sm text-[var(--muted)]">Pilih sesi untuk melihat hasil real-time.</p>
      </header>

      <div className="space-y-3 fade-in-up">
        {!events && <p className="text-[var(--muted)]">Memuat…</p>}
        {events?.length === 0 && <p className="text-[var(--muted)]">Belum ada sesi aktif.</p>}
        {events?.map((e) => (
          <Link key={e.id} href={`/results/${e.slug}`} className="panel card-link p-5 block">
            <div className="font-semibold text-lg">{e.name}</div>
            {e.description && <div className="text-sm text-[var(--muted)] mt-1">{e.description}</div>}
            <div className="mt-2 text-xs text-amber-300/80 font-mono">/results/{e.slug}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
