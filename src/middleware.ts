import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionTokenEdge } from "@/lib/session";

const PUBLIC_PAGES = ["/", "/login", "/vote", "/results"];

/** API publik (kiosk & papan hasil). API lainnya butuh sesi admin. */
const PUBLIC_API = [
  /^\/api\/auth$/,
  /^\/api\/vote\/events$/,
  /^\/api\/vote\/by-slug\/[^/]+$/,
  /^\/api\/results\/by-slug\/[^/]+$/,
  /^\/api\/events\/[^/]+\/(lookup|cast|results)(\/export)?$/,
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (PUBLIC_API.some((re) => re.test(pathname))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionTokenEdge(token) : null;
  if (session) return NextResponse.next();

  // API → 401 JSON; halaman → redirect ke login
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
