import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prisma } = await import("@/lib/db");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      positions: { orderBy: { order: "asc" }, include: { candidates: { orderBy: { number: "asc" } } } },
    },
  });
  if (!event || event.status !== "ACTIVE") {
    return NextResponse.json({ error: "Event tidak tersedia atau sudah ditutup." }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    name: event.name,
    description: event.description,
    positions: event.positions.map((p) => ({
      id: p.id,
      name: p.name,
      maxSelect: p.maxSelect,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        number: c.number,
        name: c.name,
        vision: c.vision,
        mission: c.mission,
      })),
    })),
  });
}
