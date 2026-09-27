"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EventOption = { id: string; slug: string; name: string; description: string };

/** Pemilih sesi: daftar event aktif, masing-masing dengan URL sendiri. */
export default function VoteChooserPage() {
  const [events, setEvents] = useState<EventOption[] | null>(null);

  useEffect(() => {
    fetch("/api/vote/events")
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Vote<span className="text-amber-400">Frame</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Pilih sesi pemilihan yang sedang berlangsung.</p>
        </div>

        <div className="space-y-3 fade-in-up">
          {!events && <p className="text-center text-[var(--muted)]">Memuat…</p>}
          {events?.length === 0 && (
            <p className="text-center text-[var(--muted)]">Tidak ada sesi pemilihan yang sedang aktif.</p>
          )}
          {events?.map((e) => (
            <Link
              key={e.id}
              href={`/vote/${e.slug}`}
              className="panel card-link p-5 block"
            >
              <div className="font-semibold text-lg">{e.name}</div>
              {e.description && <div className="text-sm text-[var(--muted)] mt-1">{e.description}</div>}
              <div className="mt-2 text-xs text-amber-300/80 font-mono">/vote/{e.slug}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
