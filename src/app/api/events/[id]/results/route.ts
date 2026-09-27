import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Hasil agregat anonim per posisi + partisipasi. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      positions: { orderBy: { order: "asc" }, include: { candidates: { orderBy: { number: "asc" } } } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });

  const [totalParticipants, voted, ballotCount] = await Promise.all([
    prisma.participant.count({ where: { eventId: id } }),
    prisma.participant.count({ where: { eventId: id, hasVoted: true } }),
    prisma.ballot.count({ where: { eventId: id } }),
  ]);

  // Hitung suara per kandidat dari BallotChoice (anonim)
  const tallies = await prisma.ballotChoice.groupBy({
    by: ["candidateId"],
    where: { ballot: { eventId: id } },
    _count: { _all: true },
  });
  const tallyMap = new Map(tallies.map((t) => [t.candidateId, t._count._all]));

  const positions = event.positions.map((p) => {
    const counts = p.candidates.map((c) => ({
      id: c.id,
      number: c.number,
      name: c.name,
      vision: c.vision,
      mission: c.mission,
      votes: tallyMap.get(c.id) ?? 0,
    }));
    const total = counts.reduce((s, c) => s + c.votes, 0);
    const max = Math.max(0, ...counts.map((c) => c.votes));
    return {
      id: p.id,
      name: p.name,
      maxSelect: p.maxSelect,
      totalVotes: total,
      leadingIds: counts.filter((c) => c.votes === max && max > 0).map((c) => c.id),
      candidates: counts,
    };
  });

  return NextResponse.json({
    event: { id: event.id, name: event.name, description: event.description, status: event.status },
    participation: {
      totalParticipants,
      voted,
      turnoutPct: totalParticipants > 0 ? Math.round((voted / totalParticipants) * 1000) / 10 : 0,
      ballotCount,
    },
    positions,
  });
}
