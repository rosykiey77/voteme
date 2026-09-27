"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircleIcon, TagIcon, UserIcon, VoteIcon } from "@/components/icons";

type EventRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  positions: { id: string; name: string; maxSelect: number }[];
  participantCount: number;
  candidateCount: number;
  ballotCount: number;
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge badge-active",
  DRAFT: "badge badge-draft",
  CLOSED: "badge badge-closed",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Ditutup" };

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/events");
    setEvents(await r.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function createEvent(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Gagal membuat event.");
      return;
    }
    setName("");
    setDesc("");
    load();
  }

  return (
    <div className="space-y-6 fade-in-up">
      <header>
        <h1 className="text-2xl font-bold">Event Pemilihan</h1>
        <p className="text-sm text-[var(--muted)]">Setiap event memiliki posisi, kandidat, dan peserta sendiri.</p>
      </header>

      <section className="panel p-5">
        <h2 className="font-semibold mb-3">Buat Event Baru</h2>
        <form onSubmit={createEvent} className="grid md:grid-cols-[1fr_1.4fr_auto] gap-3 items-start">
          <input
            className="input"
            placeholder="Nama event (mis. Pemilihan Ketua 2027)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Deskripsi singkat (opsional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button className="btn btn-primary" disabled={creating}>
            {creating ? "Membuat…" : "+ Buat Event"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </section>

      <section className="grid gap-3">
        {!events && <p className="text-[var(--muted)]">Memuat…</p>}
        {events?.length === 0 && <p className="text-[var(--muted)]">Belum ada event. Buat event pertama di atas.</p>}
        {events?.map((ev) => (
          <Link key={ev.id} href={`/events/${ev.id}`} className="panel card-link p-5 group">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold group-hover:text-amber-200 transition truncate">{ev.name}</h3>
                  <span className={STATUS_BADGE[ev.status]}>{STATUS_LABEL[ev.status]}</span>
                </div>
                <p className="text-sm text-[var(--muted)] truncate mt-0.5">{ev.description || "Tanpa deskripsi"}</p>
                <p className="text-xs font-mono text-amber-300/80 mt-1">/vote/{ev.slug}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[var(--text-soft)]">
                <span className="inline-flex items-center gap-1.5">
                  <TagIcon size={15} className="text-[var(--muted)]" />
                  {ev.positions.map((p) => p.name).join(", ") || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon size={15} className="text-[var(--muted)]" /> {ev.participantCount} peserta
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <VoteIcon size={15} className="text-[var(--muted)]" /> {ev.candidateCount} kandidat
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircleIcon size={15} className="text-green-400" /> {ev.ballotCount} suara
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
