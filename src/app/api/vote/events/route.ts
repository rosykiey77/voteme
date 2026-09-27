import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Daftar event berstatus ACTIVE untuk kiosk. */
export async function GET() {
  const events = await prisma.event.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true },
  });
  return NextResponse.json(events);
}
