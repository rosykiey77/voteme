import Link from "next/link";
import { MonitorIcon, ShieldIcon, VoteIcon } from "@/components/icons";

const ENTRIES = [
  {
    href: "/vote",
    icon: VoteIcon,
    title: "Voting",
    desc: "Kiosk RFID atau ketik NIK",
    tile: "icon-tile",
  },
  {
    href: "/results",
    icon: MonitorIcon,
    title: "Papan Hasil",
    desc: "Perbarui otomatis tiap 10 detik",
    tile: "icon-tile icon-tile-info",
  },
  {
    href: "/login",
    icon: ShieldIcon,
    title: "Panel Admin",
    desc: "Kelola event & peserta",
    tile: "icon-tile icon-tile-success",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="panel p-8 sm:p-10 text-center fade-in-up">
          <div className="mx-auto icon-tile icon-tile-info mb-4" style={{ width: 52, height: 52 }}>
            <VoteIcon size={26} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Vote<span className="text-amber-400">Frame</span>
          </h1>
          <p className="mt-3 text-[var(--muted)] max-w-md mx-auto">
            Sistem pemilihan karyawan berbasis RFID — multi-event, multi-posisi, suara anonim.
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
            {ENTRIES.map(({ href, icon: Icon, title, desc, tile }) => (
              <Link key={href} href={href} className="panel card-link p-5">
                <span className={tile}>
                  <Icon size={20} />
                </span>
                <div className="mt-3 font-semibold">{title}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{desc}</div>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-xs text-[var(--muted)]">
            Suara disimpan terpisah dari identitas pemilih dan tidak dapat ditelusuri.
          </p>
        </div>
      </div>
    </main>
  );
}
