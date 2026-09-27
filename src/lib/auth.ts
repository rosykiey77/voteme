import "server-only";
import { createHash, randomBytes } from "crypto";

export {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionTokenEdge as verifySessionToken,
} from "./session";

/** Mask RFID: hanya tampilkan sebagian karakter. */
export function maskRfid(uid?: string | null): string {
  if (!uid) return "—";
  if (uid.length <= 6) return uid.slice(0, 2) + "••••";
  return `${uid.slice(0, 4)}••••${uid.slice(-2)}`;
}

/** Simpan RFID sebagai hash agar isinya tidak mudah dibaca dari DB. */
export function hashRfid(uid: string): string {
  return createHash("sha256").update(uid.trim().toUpperCase()).digest("hex");
}

/** Kode struk unik untuk bukti vote (tanpa mengungkap isi pilihan). */
export function newReceiptCode(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

export async function findParticipantByRfid(eventId: string, uid: string) {
  const { prisma } = await import("./db");
  return prisma.participant.findFirst({
    where: { eventId, rfidUid: hashRfid(uid) },
    select: { id: true, name: true, nik: true, hasVoted: true },
  });
}
