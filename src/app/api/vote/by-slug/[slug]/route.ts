import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Detail event by slug untuk kiosk: posisi & kandidat (hanya event ACTIVE). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      positions: { orderBy: { order: "asc" }, include: { candidates: { orderBy: { number: "asc" } } } },
    },
  });
  if (!event || event.status !== "ACTIVE") {
    return NextResponse.json({ error: "Event tidak tersedia atau sudah ditutup." }, { status: 404 });
  }

  return NextResponse.json({
    id: event.id,
    slug: event.slug,
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
