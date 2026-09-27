"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  LockIcon,
  MonitorIcon,
  PencilIcon,
  PlayIcon,
  StopIcon,
  UploadIcon,
} from "@/components/icons";

type Candidate = { id: string; name: string; number: number; vision: string; mission: string };
type Position = { id: string; name: string; maxSelect: number; candidates: Candidate[] };
type EventDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  positions: Position[];
  participantCount: number;
  ballotCount: number;
};
type ParticipantRow = {
  id: string;
  nik: string;
  name: string;
  division: string;
  rfidMasked: string;
  hasRfid: boolean;
  hasVoted: boolean;
};

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Aktif", DRAFT: "Draft", CLOSED: "Ditutup" };
const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "badge badge-active",
  DRAFT: "badge badge-draft",
  CLOSED: "badge badge-closed",
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const notify = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadEvent = useCallback(async () => {
    const r = await fetch(`/api/events/${id}`);
    if (r.status === 404) return setNotFound(true);
    setEvent(await r.json());
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // ── Posisi & kandidat ───────────────────────────────────────────
  const [posName, setPosName] = useState("");
  const [posMax, setPosMax] = useState(1);

  async function addPosition(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/events/${id}/positions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: posName, maxSelect: posMax }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return notify(d.error || "Gagal menambah posisi.", "err");
    setPosName("");
    setPosMax(1);
    loadEvent();
    notify("Posisi ditambahkan.");
  }

  async function deletePosition(posId: string) {
    if (!confirm("Hapus posisi beserta kandidatnya?")) return;
    await fetch(`/api/positions/${posId}`, { method: "DELETE" });
    loadEvent();
    notify("Posisi dihapus.");
  }

  // ── Kandidat ────────────────────────────────────────────────────
  const [candPos, setCandPos] = useState("");
  const [candName, setCandName] = useState("");
  const [candVisi, setCandVisi] = useState("");
  const [candMisi, setCandMisi] = useState("");

  useEffect(() => {
    if (!candPos && event?.positions.length) setCandPos(event.positions[0].id);
  }, [event, candPos]);

  async function addCandidate(e: FormEvent) {
    e.preventDefault();
    if (!candPos) return notify("Tambahkan posisi dulu.", "err");
    const res = await fetch(`/api/positions/${candPos}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: candName, vision: candVisi, mission: candMisi }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return notify(d.error || "Gagal menambah kandidat.", "err");
    setCandName("");
    setCandVisi("");
    setCandMisi("");
    loadEvent();
    notify("Kandidat ditambahkan.");
  }

  async function deleteCandidate(cid: string) {
    if (!confirm("Hapus kandidat ini?")) return;
    await fetch(`/api/candidates/${cid}`, { method: "DELETE" });
    loadEvent();
    notify("Kandidat dihapus.");
  }

  // ── Peserta ─────────────────────────────────────────────────────
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [pTotal, setPTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const pageSize = 20;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>("");

  const loadParticipants = useCallback(async () => {
    const r = await fetch(`/api/events/${id}/participants?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(query)}`);
    const d = await r.json();
    setParticipants(d.rows);
    setPTotal(d.total);
  }, [id, page, query]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadResult("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/events/${id}/participants/upload`, { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) {
      setUploadResult(`Gagal: ${d.error || "Upload gagal."}${d.details ? "\n" + d.details.join("\n") : ""}`);
      return;
    }
    setUploadResult(
      `Berhasil: ${d.created} peserta baru, ${d.updated} diperbarui${d.failed ? `, ${d.failed} baris bermasalah` : ""}.` +
        (d.errors?.length ? `\n${d.errors.join("\n")}` : "")
    );
    loadParticipants();
    loadEvent();
  }

  async function deleteParticipant(pid: string) {
    if (!confirm("Hapus peserta ini?")) return;
    const res = await fetch(`/api/events/${id}/participants?participantId=${pid}`, { method: "DELETE" });
    if (res.ok) {
      loadParticipants();
      notify("Peserta dihapus.");
    } else {
      const d = await res.json().catch(() => ({}));
      notify(d.error || "Gagal menghapus.", "err");
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pTotal / pageSize)), [pTotal]);

  async function setStatus(status: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadEvent();
      notify(status === "ACTIVE" ? "Voting dibuka." : status === "CLOSED" ? "Voting ditutup." : "Event dikembalikan ke draft.");
    }
  }

  // ── Tautan event (URL kiosk & papan hasil) ────────────────────
  const [copied, setCopied] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState("");

  async function saveSlug() {
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slugDraft }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      notify(d.error || "Gagal menyimpan slug.", "err");
      return;
    }
    setEditingSlug(false);
    loadEvent();
    notify("Tautan event diperbarui.");
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  if (notFound) return <p className="text-red-300">Event tidak ditemukan.</p>;
  if (!event) return <p className="text-[var(--muted)]">Memuat…</p>;

  return (
    <div className="space-y-6 fade-in-up">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm pop-in ${
            toast.type === "ok"
              ? "bg-green-500/15 border border-green-500/40 text-green-200"
              : "bg-red-500/15 border border-red-500/40 text-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <span className={STATUS_BADGE[event.status]}>{STATUS_LABEL[event.status]}</span>
          </div>
          <p className="text-sm text-[var(--muted)] mt-1">{event.description || "Tanpa deskripsi"}</p>
        </div>
        <div className="flex gap-2">
          {event.status !== "ACTIVE" && (
            <button className="btn btn-primary" onClick={() => setStatus("ACTIVE")}>
              <PlayIcon size={16} /> Buka Voting
            </button>
          )}
          {event.status === "ACTIVE" && (
            <button className="btn btn-danger" onClick={() => setStatus("CLOSED")}>
              <StopIcon size={16} /> Tutup Voting
            </button>
          )}
          <a className="btn btn-ghost" href="/vote" target="_blank" rel="noreferrer">
            <MonitorIcon size={16} /> Kiosk ↗
          </a>
        </div>
      </header>

      {/* Panel tautan publik per event */}
      <section className="panel p-5">
        <h2 className="font-semibold mb-1">Tautan Event</h2>
        <p className="text-xs text-[var(--muted)] mb-3">
          Bagikan URL ini untuk kiosk voting dan layar TV di lokasi. Setiap event punya tautannya sendiri.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-[var(--muted)]">Kiosk Voting</div>
                <a
                  href={`/vote/${event.slug}`}
                  target="_blank"
                  className="block text-sm font-mono text-amber-300 hover:underline truncate"
                >
                  /vote/{event.slug}
                </a>
              </div>
              <button className="btn btn-ghost !py-1.5 !px-3 text-xs shrink-0" onClick={() => copyLink(`/vote/${event.slug}`)}>
                {copied === `/vote/${event.slug}` ? "✓ Tersalin" : <><CopyIcon size={13} /> Salin</>}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-[var(--muted)]">Papan Hasil (TV)</div>
                <a
                  href={`/results/${event.slug}`}
                  target="_blank"
                  className="block text-sm font-mono text-amber-300 hover:underline truncate"
                >
                  /results/{event.slug}
                </a>
              </div>
              <button className="btn btn-ghost !py-1.5 !px-3 text-xs shrink-0" onClick={() => copyLink(`/results/${event.slug}`)}>
                {copied === `/results/${event.slug}` ? "✓ Tersalin" : <><CopyIcon size={13} /> Salin</>}
              </button>
            </div>
          </div>
        </div>
        {/* Edit slug */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          {editingSlug ? (
            <>
              <input
                className="input !w-64 font-mono"
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                placeholder="mis. pemilihan-2026"
              />
              <button className="btn btn-primary !py-1.5 !px-3 text-xs" onClick={saveSlug}>
                Simpan
              </button>
              <button className="btn btn-ghost !py-1.5 !px-3 text-xs" onClick={() => setEditingSlug(false)}>
                Batal
              </button>
            </>
          ) : (
            <button
              className="text-xs text-[var(--muted)] hover:text-white"
              onClick={() => {
                setSlugDraft(event.slug);
                setEditingSlug(true);
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <PencilIcon size={13} /> Ubah alamat URL event
              </span>
            </button>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Kandidat & posisi ── */}
        <section className="space-y-4">
          <div className="panel p-5">
            <h2 className="font-semibold mb-3">Posisi Dipilih</h2>
            <p className="text-xs text-[var(--muted)] mb-3">
              Dalam satu kali vote, pemilih memilih untuk setiap posisi (mis. Ketua <em>dan</em> Pengawas).
            </p>
            <div className="space-y-3">
              {event.positions.map((p) => (
                <div key={p.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-[var(--muted)] ml-2">
                        (pilih {p.maxSelect === 1 ? "1 kandidat" : `hingga ${p.maxSelect} kandidat`})
                      </span>
                    </div>
                    <button className="text-xs text-red-300 hover:text-red-200" onClick={() => deletePosition(p.id)}>
                      Hapus
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {p.candidates.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-lg px-3 py-2">
                        <span>
                          <span className="inline-grid place-items-center w-6 h-6 rounded-md bg-amber-500/15 text-amber-300 text-xs font-bold mr-2">
                            {c.number}
                          </span>
                          {c.name}
                        </span>
                        <button className="text-xs text-red-300 hover:text-red-200" onClick={() => deleteCandidate(c.id)}>
                          ✕
                        </button>
                      </li>
                    ))}
                    {p.candidates.length === 0 && <li className="text-xs text-[var(--muted)]">Belum ada kandidat.</li>}
                  </ul>
                </div>
              ))}
            </div>

            <form onSubmit={addPosition} className="mt-4 flex gap-2">
              <input
                className="input"
                placeholder="Posisi baru (mis. Sekretaris)"
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
                required
              />
              <input
                className="input w-24"
                type="number"
                min={1}
                max={10}
                value={posMax}
                onChange={(e) => setPosMax(Number(e.target.value))}
                title="Maks pilihan per pemilih"
              />
              <button className="btn btn-ghost">+ Posisi</button>
            </form>
          </div>

          <div className="panel p-5">
            <h2 className="font-semibold mb-3">Tambah Kandidat</h2>
            <form onSubmit={addCandidate} className="space-y-3">
              <select className="input" value={candPos} onChange={(e) => setCandPos(e.target.value)}>
                {event.positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Nama kandidat"
                value={candName}
                onChange={(e) => setCandName(e.target.value)}
                required
              />
              <input className="input" placeholder="Visi (opsional)" value={candVisi} onChange={(e) => setCandVisi(e.target.value)} />
              <textarea
                className="input"
                placeholder="Misi (opsional)"
                value={candMisi}
                onChange={(e) => setCandMisi(e.target.value)}
                rows={2}
              />
              <button className="btn btn-primary w-full">+ Tambah Kandidat</button>
            </form>
          </div>
        </section>

        {/* ── Peserta ── */}
        <section className="panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Peserta ({event.participantCount})</h2>
            <a className="text-xs text-amber-300 hover:underline inline-flex items-center gap-1.5" href={`/api/events/${id}/participants/export`}>
              <DownloadIcon size={14} /> Export CSV
            </a>
          </div>

          <div
            className="rounded-xl border-2 border-dashed border-[var(--border)] hover:border-amber-500/50 transition p-6 text-center cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) uploadFile(f);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
              }}
            />
            <div className="mx-auto icon-tile icon-tile-info mb-3" style={{ width: 48, height: 48 }}>
              {uploading ? <UploadIcon size={22} /> : <FileTextIcon size={22} />}
            </div>
            <p className="text-sm font-medium">{uploading ? "Mengunggah…" : "Upload file NIK karyawan"}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Tarik & letakkan file <b>.csv / .xlsx</b> atau klik di sini.
              <br />
              Kolom: <code>nik, nama, divisi, rfid</code> (rfid opsional, akan disembunyikan &amp; di-hash)
            </p>
          </div>

          {uploadResult && (
            <pre className="mt-3 text-xs whitespace-pre-wrap bg-white/[0.04] border border-[var(--border)] rounded-lg p-3 max-h-40 overflow-auto">
              {uploadResult}
            </pre>
          )}

          <div className="mt-4 flex gap-2">
            <input
              className="input"
              placeholder="Cari NIK / nama / divisi…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-2">NIK</th>
                  <th className="py-2 pr-2">Nama</th>
                  <th className="py-2 pr-2">Divisi</th>
                  <th className="py-2 pr-2">RFID</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)]/50">
                    <td className="py-2 pr-2 font-mono text-xs">{p.nik}</td>
                    <td className="py-2 pr-2">{p.name}</td>
                    <td className="py-2 pr-2 text-[var(--muted)]">{p.division || "—"}</td>
                    <td className="py-2 pr-2 font-mono text-xs text-[var(--muted)]">
                      {p.hasRfid ? (
                        <span className="inline-flex items-center gap-1.5">
                          <LockIcon size={12} /> {p.rfidMasked}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {p.hasVoted ? (
                        <span className="text-green-300 text-xs">✓ voted</span>
                      ) : (
                        <span className="text-[var(--muted)] text-xs">belum</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {!p.hasVoted && (
                        <button className="text-xs text-red-300 hover:text-red-200" onClick={() => deleteParticipant(p.id)}>
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {participants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-[var(--muted)] text-sm">
                      Belum ada peserta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Sebelumnya
              </button>
              <span className="text-[var(--muted)] text-xs">
                Halaman {page} / {totalPages}
              </span>
              <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
