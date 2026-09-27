import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Hasil agregat anonim by slug (papan hasil publik). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      positions: { orderBy: { order: "asc" }, include: { candidates: { orderBy: { number: "asc" } } } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });

  const [totalParticipants, ballotCount] = await Promise.all([
    prisma.participant.count({ where: { eventId: event.id } }),
    prisma.ballot.count({ where: { eventId: event.id } }),
  ]);
  const voted = await prisma.participant.count({ where: { eventId: event.id, hasVoted: true } });

  const tallies = await prisma.ballotChoice.groupBy({
    by: ["candidateId"],
    where: { ballot: { eventId: event.id } },
    _count: { _all: true },
  });
  const tallyMap = new Map(tallies.map((t) => [t.candidateId, t._count._all]));

  return NextResponse.json({
    event: { id: event.id, slug: event.slug, name: event.name, description: event.description, status: event.status },
    participation: {
      totalParticipants,
      voted,
      turnoutPct: totalParticipants > 0 ? Math.round((voted / totalParticipants) * 1000) / 10 : 0,
      ballotCount,
    },
    positions: event.positions.map((p) => {
      const counts = p.candidates.map((c) => ({ id: c.id, number: c.number, name: c.name, votes: tallyMap.get(c.id) ?? 0 }));
      const max = Math.max(0, ...counts.map((c) => c.votes));
      return {
        id: p.id,
        name: p.name,
        totalVotes: counts.reduce((s, c) => s + c.votes, 0),
        leadingIds: counts.filter((c) => c.votes === max && max > 0).map((c) => c.id),
        candidates: counts,
      };
    }),
  });
}
