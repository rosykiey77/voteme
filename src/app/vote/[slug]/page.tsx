"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CardIcon, CheckCircleIcon, KeyboardIcon, SearchIcon, VoteIcon } from "@/components/icons";

type Candidate = { id: string; number: number; name: string; vision: string; mission: string };
type Position = { id: string; name: string; maxSelect: number; candidates: Candidate[] };
type ActiveEvent = { id: string; slug: string; name: string; description: string; positions: Position[] };

type Step = "identify" | "ballot" | "receipt" | "error";

/** Kiosk voting untuk satu event: /vote/<slug> */
export default function VoteEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<Step>("identify");
  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [voter, setVoter] = useState<{ participantId: string; name: string; nik: string; division: string } | null>(null);
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipts, setReceipts] = useState<string[]>([]);
  const [tab, setTab] = useState<"rfid" | "nik">("rfid");
  const nikRef = useRef<HTMLInputElement>(null);

  // ── Muat event by slug ─────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/vote/by-slug/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not-found");
        return r.json();
      })
      .then(setEvent)
      .catch(() => setNotFound(true));
  }, [slug]);

  // ── Identifikasi: RFID (auto-submit) / NIK ─────────────────────
  const identify = useCallback(
    async (payload: { uid?: string; nik?: string }) => {
      if (!event) return;
      setError("");
      const res = await fetch(`/api/events/${event.id}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Gagal mengenali pemilih.");
        return;
      }
      setVoter({ participantId: d.token, name: d.name, nik: d.nik, division: d.division });
      setChoices({});
      setStep("ballot");
    },
    [event]
  );

  // RFID reader mengetik cepat lalu Enter — tangkap di window
  useEffect(() => {
    if (step !== "identify" || tab !== "rfid") return;
    let buf = "";
    let timer: ReturnType<typeof setTimeout>;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        if (buf.trim()) identify({ uid: buf.trim() });
        buf = "";
        return;
      }
      if (e.key.length === 1) {
        buf += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => (buf = ""), 300);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [step, tab, identify]);

  function submitNik(e: FormEvent) {
    e.preventDefault();
    const v = nikRef.current?.value.trim();
    if (v) identify({ nik: v });
  }

  // ── Pilihan kandidat ───────────────────────────────────────────
  function toggleChoice(positionId: string, candidateId: string, maxSelect: number) {
    setChoices((prev) => {
      const cur = prev[positionId] ?? [];
      let next: string[];
      if (cur.includes(candidateId)) {
        next = cur.filter((c) => c !== candidateId);
      } else {
        next = [...cur, candidateId];
        if (next.length > maxSelect) next = next.slice(next.length - maxSelect);
      }
      return { ...prev, [positionId]: next };
    });
  }

  async function submitBallot() {
    if (!event || !voter) return;
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/events/${event.id}/cast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: voter.participantId, choices }),
    });
    const d = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(d.error || "Gagal menyimpan suara.");
      return;
    }
    setReceipts(d.receiptCodes);
    setStep("receipt");
  }

  function reset() {
    setStep("identify");
    setVoter(null);
    setChoices({});
    setReceipts([]);
    setError("");
  }

  // ── Render ─────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main className="min-h-screen grid place-items-center p-4">
        <div className="panel p-8 text-center max-w-md">
          <div className="icon-tile icon-tile-info mx-auto mb-3" style={{ width: 52, height: 52 }}>
            <SearchIcon size={26} />
          </div>
          <h1 className="text-lg font-bold">Sesi tidak ditemukan</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Event tidak ada atau belum dibuka. Tanyakan tautan yang benar ke panitia.
          </p>
          <Link href="/vote" className="btn btn-ghost mt-5">
            ← Lihat semua sesi
          </Link>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p className="text-[var(--muted)]">Memuat sesi…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Vote<span className="text-amber-400">Frame</span>
          </h1>
          <p className="text-sm text-[var(--muted)]">Suara Anda rahasia — sistem tidak menyimpan pilihan bersama identitas.</p>
        </div>

        {/* STEP: identifikasi */}
        {step === "identify" && (
          <div className="panel p-6 fade-in-up">
            <h2 className="font-semibold text-lg">{event.name}</h2>
            {event.description && <p className="text-sm text-[var(--muted)]">{event.description}</p>}

            <div className="mt-4 flex gap-2 p-1 rounded-xl bg-white/5 border border-[var(--border)]">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${tab === "rfid" ? "bg-amber-500 text-[#23160a]" : "text-[var(--text-soft)] hover:bg-white/5"}`}
                onClick={() => setTab("rfid")}
              >
                <CardIcon size={16} /> Tab Kartu RFID
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${tab === "nik" ? "bg-amber-500 text-[#23160a]" : "text-[var(--text-soft)] hover:bg-white/5"}`}
                onClick={() => setTab("nik")}
              >
                <KeyboardIcon size={16} /> Ketik NIK
              </button>
            </div>

            {tab === "rfid" ? (
              <div className="mt-6 text-center py-8">
                <div className="mx-auto w-24 h-24 rounded-full border-2 border-dashed border-blue-400/60 pulse-ring grid place-items-center text-blue-300">
                  <CardIcon size={40} />
                </div>
                <p className="mt-4 font-medium">Tempelkan kartu ke reader…</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Reader HID mengetik UID otomatis. Kartu demo: <code>04A7B2C1D3</code>
                </p>
              </div>
            ) : (
              <form onSubmit={submitNik} className="mt-6 space-y-3">
                <input
                  ref={nikRef}
                  className="input text-center text-lg tracking-widest"
                  placeholder="Ketik NIK Anda (mis. EMP001)"
                  autoFocus
                />
                <button className="btn btn-primary w-full">Lanjutkan</button>
              </form>
            )}

            {error && <p className="mt-4 text-sm text-red-300 text-center">{error}</p>}
          </div>
        )}

        {/* STEP: lembar suara */}
        {step === "ballot" && voter && (
          <div className="space-y-4 fade-in-up">
            <div className="panel p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--muted)]">Anda terdaftar sebagai</div>
                <div className="font-semibold">
                  {voter.name} <span className="text-[var(--muted)] font-normal">• {voter.division || "—"}</span>
                </div>
              </div>
              <button className="text-xs text-[var(--muted)] hover:text-white" onClick={reset}>
                bukan saya ↺
              </button>
            </div>

            {event.positions.map((pos) => (
              <div key={pos.id} className="panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{pos.name}</h3>
                  <span className="badge badge-draft">pilih {pos.maxSelect === 1 ? "satu" : `hingga ${pos.maxSelect}`}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pos.candidates.map((c) => {
                    const checked = (choices[pos.id] ?? []).includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleChoice(pos.id, c.id, pos.maxSelect)}
                        className={`text-left p-4 rounded-xl border transition ${
                          checked
                            ? "border-amber-400 bg-amber-500/10 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
                            : "border-[var(--border)] hover:border-amber-500/40 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-grid place-items-center w-9 h-9 rounded-xl font-bold ${
                              checked ? "bg-amber-400 text-[#1a1206]" : "bg-white/10"
                            }`}
                          >
                            {c.number}
                          </span>
                          <div>
                            <div className="font-semibold">{c.name}</div>
                            {c.vision && <div className="text-xs text-[var(--muted)] line-clamp-2">{c.vision}</div>}
                          </div>
                          {checked && <span className="ml-auto text-amber-300 text-xl">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                  {pos.candidates.length === 0 && (
                    <p className="text-sm text-[var(--muted)]">Belum ada kandidat untuk posisi ini.</p>
                  )}
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-red-300 text-center">{error}</p>}

            <button className="btn btn-primary w-full text-base py-4" disabled={submitting} onClick={submitBallot}>
              <VoteIcon size={18} />
              {submitting ? "Menyimpan…" : "Kirim Suara"}
            </button>
            <p className="text-xs text-center text-[var(--muted)]">
              Setelah dikirim, pilihan tidak dapat diubah dan tidak dapat ditelusuri kembali ke identitas Anda.
            </p>
          </div>
        )}

        {/* STEP: struk */}
        {step === "receipt" && (
          <div className="panel p-8 text-center fade-in-up pop-in">
            <div className="icon-tile icon-tile-success mx-auto mb-3" style={{ width: 56, height: 56 }}>
              <CheckCircleIcon size={30} />
            </div>
            <h2 className="text-xl font-bold">Suara Terkirim!</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Terima kasih telah berpartisipasi.</p>
            <div className="mt-5 text-left bg-white/[0.04] border border-[var(--border)] rounded-xl p-4">
              <div className="text-xs text-[var(--muted)] mb-1">Kode struk (simpan/abaikan):</div>
              {receipts.map((r) => (
                <div key={r} className="font-mono text-amber-300 tracking-wider">
                  {r}
                </div>
              ))}
              <p className="text-[11px] text-[var(--muted)] mt-2">
                Kode ini tidak bisa digunakan untuk melihat pilihan Anda — hanya bukti suara masuk.
              </p>
            </div>
            <button className="btn btn-ghost mt-5" onClick={reset}>
              ← Selesai (pemilih berikutnya)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
