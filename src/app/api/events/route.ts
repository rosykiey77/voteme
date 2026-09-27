import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participants: true, candidates: true, ballots: true } },
      positions: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      status: e.status,
      positions: e.positions.map((p) => ({ id: p.id, name: p.name, maxSelect: p.maxSelect })),
      participantCount: e._count.participants,
      candidateCount: e._count.candidates,
      ballotCount: e._count.ballots,
      createdAt: e.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nama event wajib diisi." }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      name,
      slug: await uniqueSlug(name),
      description,
      positions: { create: { name: "Ketua", order: 1, maxSelect: 1 } },
    },
  });
  return NextResponse.json({ id: event.id, slug: event.slug }, { status: 201 });
}
