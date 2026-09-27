import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Ringkasan untuk dashboard admin: semua event + statistik agregat. */
export async function GET() {
  const [events, totalParticipants, totalBallots, activeEvents] = await Promise.all([
    prisma.event.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.participant.count(),
    prisma.ballot.count(),
    prisma.event.count({ where: { status: "ACTIVE" } }),
  ]);

  const recent = await prisma.ballot.findMany({
    orderBy: { castAt: "desc" },
    take: 8,
    include: {
      position: { select: { name: true } },
      choices: { include: { candidate: { select: { name: true, number: true } } } },
    },
  });

  return NextResponse.json({
    stats: {
      eventCount: events.length,
      activeEvents,
      totalParticipants,
      totalBallots,
    },
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      description: e.description,
    })),
    recentActivity: recent.map((b) => ({
      at: b.castAt,
      position: b.position.name,
      candidates: b.choices.map((c) => `${c.candidate.number}. ${c.candidate.name}`).join(", "),
    })),
  });
}

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json({ error: "Not supported." }, { status: 405 });
}
