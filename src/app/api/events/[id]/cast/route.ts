import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Submit suara. Body: { participantId, choices: { [positionId]: candidateId[] } }
 * - Satu ballot terpisah per posisi, tanpa identitas pemilih (anonim).
 * - Participant hanya ditandai hasVoted; tidak ada relasi ke isi pilihan.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const participantId = String(body?.participantId ?? "");
  const choices: Record<string, string[]> = body?.choices ?? {};

  if (!participantId) return NextResponse.json({ error: "Sesi pemilih tidak valid." }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id },
    include: { positions: { include: { candidates: true } } },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  if (event.status !== "ACTIVE") {
    return NextResponse.json({ error: "Sesi voting belum dibuka atau sudah ditutup." }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.eventId !== id) {
    return NextResponse.json({ error: "Peserta tidak ditemukan." }, { status: 404 });
  }
  if (participant.hasVoted) {
    return NextResponse.json({ error: "Anda sudah menggunakan hak pilih." }, { status: 409 });
  }

  // ── Validasi pilihan per posisi ───────────────────────────────
  const ballotsToCreate: { positionId: string; candidateIds: string[] }[] = [];
  for (const position of event.positions) {
    const picked = Array.isArray(choices[position.id]) ? [...new Set(choices[position.id])] : [];
    if (picked.length === 0) {
      return NextResponse.json({ error: `Pilihan untuk "${position.name}" belum diisi.` }, { status: 400 });
    }
    if (picked.length > position.maxSelect) {
      return NextResponse.json(
        { error: `Posisi "${position.name}" maksimal ${position.maxSelect} pilihan.` },
        { status: 400 }
      );
    }
    const validIds = new Set(position.candidates.map((c) => c.id));
    if (!picked.every((cid) => validIds.has(cid))) {
      return NextResponse.json({ error: `Pilihan pada "${position.name}" tidak valid.` }, { status: 400 });
    }
    ballotsToCreate.push({ positionId: position.id, candidateIds: picked });
  }

  // ── Simpan atomik: tandai voted + buat ballot anonim ──────────
  const receipts = await prisma.$transaction(async (tx) => {
    const fresh = await tx.participant.findUnique({
      where: { id: participantId },
      select: { hasVoted: true },
    });
    if (fresh?.hasVoted) throw new Error("ALREADY_VOTED");

    await tx.participant.update({
      where: { id: participantId },
      data: { hasVoted: true, votedAt: new Date() },
    });

    const codes: string[] = [];
    for (const b of ballotsToCreate) {
      const ballot = await tx.ballot.create({
        data: {
          eventId: id,
          positionId: b.positionId,
          receiptCode: crypto.randomUUID().replace(/-/g, "").toUpperCase(),
          choices: { create: b.candidateIds.map((candidateId) => ({ candidateId })) },
        },
      });
      codes.push(ballot.receiptCode);
    }
    return codes;
  }).catch((e: unknown) => {
    if (e instanceof Error && e.message === "ALREADY_VOTED") {
      return NextResponse.json({ error: "Anda sudah menggunakan hak pilih." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan suara." }, { status: 500 });
  });

  if (receipts instanceof NextResponse) return receipts;

  return NextResponse.json({ ok: true, receiptCodes: receipts }, { status: 201 });
}
