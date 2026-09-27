"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  MonitorIcon,
  UsersIcon,
  VoteIcon,
  type IconProps,
} from "@/components/icons";

type Dash = {
  stats: { eventCount: number; activeEvents: number; totalParticipants: number; totalBallots: number };
  events: { id: string; name: string; status: string; description: string }[];
  recentActivity: { at: string; position: string; candidates: string }[];
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge badge-active",
  DRAFT: "badge badge-draft",
  CLOSED: "badge badge-closed",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Ditutup" };

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error("Gagal memuat."))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-300">{err}</p>;
  if (!data) return <p className="text-[var(--muted)]">Memuat…</p>;

  const cards: { label: string; value: number; icon: (p: IconProps) => React.ReactElement; tile: string; href: string }[] = [
    { label: "Total Event", value: data.stats.eventCount, icon: VoteIcon, tile: "icon-tile", href: "/events" },
    { label: "Event Aktif", value: data.stats.activeEvents, icon: MonitorIcon, tile: "icon-tile icon-tile-info", href: "/events" },
    { label: "Total Peserta", value: data.stats.totalParticipants, icon: UsersIcon, tile: "icon-tile", href: "/events" },
    { label: "Suara Masuk", value: data.stats.totalBallots, icon: CheckCircleIcon, tile: "icon-tile icon-tile-success", href: "/reports" },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">Ringkasan seluruh kegiatan pemilihan.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, tile, href }) => (
          <Link key={label} href={href} className="panel card-link p-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-[var(--muted)]">{label}</div>
              <div className="stat-value mt-2">{value}</div>
            </div>
            <span className={tile}>
              <Icon size={20} />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h2 className="font-semibold mb-3">Event Terbaru</h2>
          {data.events.length === 0 && <p className="text-sm text-[var(--muted)]">Belum ada event.</p>}
          <ul className="space-y-2">
            {data.events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-white/[0.04] hover:border-[var(--border)] transition"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{e.name}</div>
                    <div className="text-xs text-[var(--muted)] truncate">{e.description || "—"}</div>
                  </div>
                  <span className={STATUS_BADGE[e.status] ?? "badge badge-draft"}>{STATUS_LABEL[e.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="font-semibold mb-3">Aktivitas Vote Terakhir</h2>
          {data.recentActivity.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Belum ada suara masuk.</p>
          )}
          <ul className="space-y-2">
            {data.recentActivity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm p-2.5 rounded-xl bg-white/[0.03]">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{a.position}</span>
                  <span className="text-[var(--muted)]"> — {a.candidates}</span>
                </div>
                <span className="text-xs text-[var(--muted)] shrink-0">
                  {new Date(a.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Identitas pemilih tidak ditampilkan demi kerahasiaan suara.
          </p>
        </div>
      </section>
    </div>
  );
}
