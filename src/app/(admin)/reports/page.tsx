"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DownloadIcon } from "@/components/icons";

type PositionResult = {
  id: string;
  name: string;
  maxSelect: number;
  totalVotes: number;
  leadingIds: string[];
  candidates: { id: string; number: number; name: string; vision: string; mission: string; votes: number }[];
};
type Results = {
  event: { id: string; name: string; description: string; status: string };
  participation: { totalParticipants: number; voted: number; turnoutPct: number; ballotCount: number };
  positions: PositionResult[];
};
type EventRow = { id: string; name: string; status: string };

export default function ReportsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d: EventRow[]) => {
        setEvents(d);
        if (!selected && d.length > 0) setSelected(d[0].id);
      })
      .catch(() => setEvents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResults = useCallback(async (eventId: string) => {
    if (!eventId) return;
    const r = await fetch(`/api/events/${eventId}/results`);
    if (r.ok) setResults(await r.json());
  }, []);

  useEffect(() => {
    loadResults(selected);
    const t = setInterval(() => loadResults(selected), 15000);
    return () => clearInterval(t);
  }, [selected, loadResults]);

  return (
    <div className="space-y-6 fade-in-up">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Laporan Hasil</h1>
          <p className="text-sm text-[var(--muted)]">Rekapitulasi suara anonim per posisi.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input !w-64" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {!events?.length && <option value="">Belum ada event</option>}
            {events?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.status === "ACTIVE" ? "• aktif" : e.status === "CLOSED" ? "• ditutup" : ""}
              </option>
            ))}
          </select>
          {selected && (
            <a className="btn btn-ghost" href={`/api/events/${selected}/results/export`}>
              <DownloadIcon size={16} /> Export
            </a>
          )}
        </div>
      </header>

      {!selected && <p className="text-[var(--muted)]">Belum ada event. <Link href="/events" className="text-amber-300 underline">Buat event</Link> dulu.</p>}

      {results && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Peserta", value: results.participation.totalParticipants },
              { label: "Sudah Vote", value: results.participation.voted },
              { label: "Partisipasi", value: `${results.participation.turnoutPct}%` },
              { label: "Total Suara", value: results.participation.ballotCount },
            ].map((c) => (
              <div key={c.label} className="panel p-5">
                <div className="text-3xl font-extrabold">{c.value}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">{c.label}</div>
              </div>
            ))}
          </section>

          {results.positions.map((pos) => (
            <section key={pos.id} className="panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">{pos.name}</h2>
                <span className="text-xs text-[var(--muted)]">
                  {pos.totalVotes} suara • max {pos.maxSelect} pilihan/pemilih
                </span>
              </div>
              <div className="space-y-3">
                {pos.candidates.map((c) => {
                  const pct = pos.totalVotes > 0 ? Math.round((c.votes / pos.totalVotes) * 100) : 0;
                  const leading = pos.leadingIds.includes(c.id);
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 text-xs font-bold">
                            {c.number}
                          </span>
                          <b>{c.name}</b>
                          {leading && <span className="badge badge-active">unggul</span>}
                        </span>
                        <span className="font-mono text-[var(--muted)]">
                          {c.votes} suara ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
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
        </>
      )}
    </div>
  );
}
