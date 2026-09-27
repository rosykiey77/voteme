import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { hashRfid } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function cellStr(v: unknown): string {
  return String(v ?? "").trim();
}

/** Upload peserta: menerima multipart file .csv/.xlsx (kolom: nik, nama, divisi, rfid) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  if (event.status === "CLOSED") {
    return NextResponse.json({ error: "Event sudah ditutup." }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  // ── Parse file CSV/Excel ────────────────────────────────────────
  let rows: Record<string, unknown>[] = [];
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer", raw: false });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "Gagal membaca file. Pastikan format .csv atau .xlsx valid." }, { status: 400 });
  }
  if (!rows.length) {
    return NextResponse.json({ error: "File kosong atau tidak ada baris data." }, { status: 400 });
  }

  // ── Normalisasi header (nik/nama/divisi/rfid, toleran variasi) ──
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const pick = (row: Record<string, unknown>, ...names: string[]) => {
    const map = new Map(Object.keys(row).map((k) => [norm(k), k]));
    for (const n of names) {
      const key = map.get(norm(n));
      if (key !== undefined && cellStr(row[key])) return cellStr(row[key]);
    }
    return "";
  };

  const inserts: {
    eventId: string; nik: string; name: string; division: string; rfidUid: string | null;
  }[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const nik = pick(row, "nik", "employeeid", "idkaryawan", "nip");
    const name = pick(row, "nama", "name");
    const division = pick(row, "divisi", "division", "department", "departemen");
    const rfid = pick(row, "rfid", "rfiduid", "uid", "kartu", "carduid");

    if (!nik || !name) {
      errors.push(`Baris ${i + 2}: kolom NIK dan Nama wajib diisi.`);
      return;
    }
    if (seen.has(nik)) {
      errors.push(`Baris ${i + 2}: NIK ${nik} duplikat dalam file, dilewati.`);
      return;
    }
    seen.add(nik);
    inserts.push({ eventId: id, nik, name, division, rfidUid: rfid ? hashRfid(rfid) : null });
  });

  if (!inserts.length) {
    return NextResponse.json({ error: "Tidak ada baris valid.", details: errors.slice(0, 10) }, { status: 400 });
  }

  // ── Upsert per (eventId, nik) ─────────────────────────────────
  let created = 0;
  let updated = 0;
  for (const row of inserts) {
    const existing = await prisma.participant.findUnique({
      where: { eventId_nik: { eventId: id, nik: row.nik } },
      select: { id: true, hasVoted: true },
    });
    if (existing) {
      if (existing.hasVoted) {
        errors.push(`NIK ${row.nik}: sudah vote, data tidak diubah.`);
        continue;
      }
      await prisma.participant.update({ where: { id: existing.id }, data: row });
      updated++;
    } else {
      await prisma.participant.create({ data: row });
      created++;
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    failed: errors.length,
    errors: errors.slice(0, 20),
  });
}
