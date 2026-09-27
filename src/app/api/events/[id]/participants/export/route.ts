import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Export CSV daftar peserta — kolom RFID sengaja TIDAK disertakan. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await prisma.participant.findMany({ where: { eventId: id }, orderBy: { nik: "asc" } });

  const header = "nik,nama,divisi,status_vote,waktu_vote";
  const lines = rows.map((p) =>
    [p.nik, `"${p.name.replace(/"/g, '""')}"`, `"${p.division.replace(/"/g, '""')}"`, p.hasVoted ? "sudah" : "belum", p.votedAt ? p.votedAt.toISOString() : ""].join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="peserta-${id}.csv"`,
    },
  });
}
