import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Export CSV rekap hasil (agregat per kandidat, tanpa data pemilih). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { positions: { orderBy: { order: "asc" }, include: { candidates: { orderBy: { number: "asc" } } } } },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });

  const tallies = await prisma.ballotChoice.groupBy({
    by: ["candidateId"],
    where: { ballot: { eventId: id } },
    _count: { _all: true },
  });
  const tallyMap = new Map(tallies.map((t) => [t.candidateId, t._count._all]));

  const header = "posisi,no_urut,kandidat,jumlah_suara";
  const lines: string[] = [];
  for (const p of event.positions) {
    for (const c of p.candidates) {
      lines.push([`"${p.name}"`, c.number, `"${c.name.replace(/"/g, '""')}"`, tallyMap.get(c.id) ?? 0].join(","));
    }
  }
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hasil-${id}.csv"`,
    },
  });
}
