import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskRfid } from "@/lib/auth";

/** Daftar peserta event. RFID selalu dikembalikan dalam bentuk ter-mask. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get("pageSize") ?? 20) || 20));

  const where = q ? { eventId: id, OR: [{ nik: { contains: q } }, { name: { contains: q } }, { division: { contains: q } }] } : { eventId: id };

  const [total, rows] = await Promise.all([
    prisma.participant.count({ where }),
    prisma.participant.findMany({
      where,
      orderBy: { nik: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    rows: rows.map((p) => ({
      id: p.id,
      nik: p.nik,
      name: p.name,
      division: p.division,
      rfidMasked: maskRfid(p.rfidUid),
      hasRfid: Boolean(p.rfidUid),
      hasVoted: p.hasVoted,
      votedAt: p.votedAt,
    })),
  });
}

/** Hapus satu peserta (belum vote). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participantId = req.nextUrl.searchParams.get("participantId");
  if (!participantId) return NextResponse.json({ error: "participantId wajib." }, { status: 400 });

  const p = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!p || p.eventId !== id) return NextResponse.json({ error: "Peserta tidak ditemukan." }, { status: 404 });
  if (p.hasVoted) return NextResponse.json({ error: "Peserta sudah vote, tidak dapat dihapus." }, { status: 400 });

  await prisma.participant.delete({ where: { id: participantId } });
  return NextResponse.json({ ok: true });
}
