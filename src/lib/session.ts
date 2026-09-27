import { SignJWT, jwtVerify } from "jose";

/** Util edge-safe: aman dipakai di middleware (tanpa modul node crypto). */

const encoder = new TextEncoder();

export const SESSION_COOKIE = "admin_session";

function secret(): Uint8Array {
  return encoder.encode(process.env.AUTH_SECRET || "dev-secret-ganti-di-production");
}

export type SessionPayload = {
  sub: string;
  name: string;
  iat: number;
};

export async function createSessionToken(username: string, name: string) {
  return new SignJWT({ name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifySessionTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub),
      name: String(payload.name ?? "Admin"),
      iat: Number(payload.iat ?? 0),
    };
  } catch {
    return null;
  }
}
