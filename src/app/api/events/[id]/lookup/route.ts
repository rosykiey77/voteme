import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Lookup pemilih di kiosk: tap RFID (uid) atau ketik NIK.
 * Response hanya memuat identitas minimum untuk konfirmasi di layar.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const uid = String(body?.uid ?? "").trim();
  const nik = String(body?.nik ?? "").trim();

  if (!uid && !nik) {
    return NextResponse.json({ error: "Tap kartu RFID atau masukkan NIK." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id }, select: { status: true } });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  if (event.status !== "ACTIVE") {
    return NextResponse.json({ error: "Sesi voting belum dibuka atau sudah ditutup." }, { status: 400 });
  }

  const participant = uid
    ? await prisma.participant.findFirst({
        where: { eventId: id, rfidUid: createHash("sha256").update(uid.trim().toUpperCase()).digest("hex") },
      })
    : await prisma.participant.findUnique({
        where: { eventId_nik: { eventId: id, nik } },
      });

  if (!participant) {
    return NextResponse.json({ error: uid ? "Kartu tidak terdaftar." : "NIK tidak terdaftar." }, { status: 404 });
  }

  if (participant.hasVoted) {
    return NextResponse.json({ error: "Anda sudah menggunakan hak pilih." }, { status: 409 });
  }

  return NextResponse.json({
    token: participant.id, // sementara; dikonfirmasi lagi saat submit
    name: participant.name,
    nik: participant.nik,
    division: participant.division,
  });
}
