"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartIcon,
  DashboardIcon,
  LogoutIcon,
  MonitorIcon,
  VoteIcon,
  type IconProps,
} from "@/components/icons";

type NavItem = { href: string; label: string; icon: (p: IconProps) => React.ReactElement };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/events", label: "Event Pemilihan", icon: VoteIcon },
  { href: "/reports", label: "Laporan", icon: ChartIcon },
];

const EXTERNAL = [
  { href: "/vote", label: "Buka Kiosk Voting", icon: VoteIcon },
  { href: "/results", label: "Papan Hasil", icon: MonitorIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAdminName(d.name || d.username))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur sticky top-0 h-screen">
        <div className="p-5 border-b border-[var(--border)]">
          <Link href="/dashboard" className="text-xl font-extrabold tracking-tight">
            Vote<span className="text-amber-400">Frame</span>
          </Link>
          <div className="text-xs text-[var(--muted)] mt-1">Panel Admin</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-amber-500/15 text-amber-200 border border-amber-500/30"
                    : "text-[var(--text-soft)] hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <Icon size={18} className={active ? "text-amber-300" : ""} />
                {label}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-[var(--border)] space-y-1">
            {EXTERNAL.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-soft)] hover:bg-white/5 hover:text-white transition"
              >
                <Icon size={18} />
                {label}
                <span className="ml-auto text-[var(--muted)]" aria-hidden>
                  ↗
                </span>
              </a>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{adminName || "Admin"}</div>
            <button
              onClick={logout}
              className="text-xs text-[var(--muted)] hover:text-red-300 transition inline-flex items-center gap-1.5"
            >
              <LogoutIcon size={14} /> Keluar
            </button>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 grid place-items-center font-bold text-[#23160a] shrink-0">
            {(adminName || "A").charAt(0).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar mobile */}
        <div className="md:hidden sticky top-0 z-20 bg-[var(--panel)]/90 backdrop-blur border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-extrabold">
            Vote<span className="text-amber-400">Frame</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className={`p-2 rounded-lg transition ${
                    active ? "text-amber-300 bg-amber-500/15" : "text-[var(--text-soft)] hover:bg-white/5"
                  }`}
                >
                  <Icon size={20} />
                </Link>
              );
            })}
            <button
              onClick={logout}
              aria-label="Keluar"
              className="p-2 rounded-lg text-[var(--text-soft)] hover:bg-white/5 hover:text-red-300 transition"
            >
              <LogoutIcon size={20} />
            </button>
          </div>
        </div>

        <main className="p-4 md:p-8 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
