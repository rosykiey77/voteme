/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashRfid(uid: string) {
  return createHash("sha256").update(uid.trim().toUpperCase()).digest("hex");
}

async function main() {
  // ── Admin default (kredensial dari .env) ──────────────────────
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash: createHash("sha256").update(password).digest("hex") },
    create: {
      username,
      passwordHash: createHash("sha256").update(password).digest("hex"),
      name: "Administrator",
    },
  });

  // ── Event demo ────────────────────────────────────────────────
  const existing = await prisma.event.findFirst({ where: { name: "Pemilihan Ketua & Pengawas 2026" } });
  if (existing) {
    console.log("Seed sudah ada, lewati.");
    return;
  }

  const event = await prisma.event.create({
    data: {
      name: "Pemilihan Ketua & Pengawas 2026",
      slug: "pemilihan-2026",
      description: "Pemilihan pimpinan komite karyawan periode 2026–2028.",
      status: "ACTIVE",
      positions: {
        create: [
          { name: "Ketua Komite", order: 1, maxSelect: 1 },
          { name: "Pengawas", order: 2, maxSelect: 1 },
        ],
      },
    },
    include: { positions: true },
  });

  const [ketua, pengawas] = event.positions;

  await prisma.candidate.createMany({
    data: [
      { eventId: event.id, positionId: ketua.id, name: "Andi Wijaya", number: 1, vision: "Efisiensi & kolaborasi lintas divisi.", mission: "1. Sistem absensi baru\n2. Program pelatihan tahunan\n3. Kafe karyawan" },
      { eventId: event.id, positionId: ketua.id, name: "Siti Rahma", number: 2, vision: "Kesejahteraan karyawan prioritas utama.", mission: "1. Review gaji berkala\n2. Asuransi keluarga\n3. Fleksibel WFH" },
      { eventId: event.id, positionId: pengawas.id, name: "Budi Santoso", number: 1, vision: "Transparansi penuh laporan keuangan.", mission: "1. Audit kuartalan\n2. Portal pengaduan" },
      { eventId: event.id, positionId: pengawas.id, name: "Dewi Lestari", number: 2, vision: "Pengawasan aktif & responsif.", mission: "1. Rapat umum bulanan\n2. Checklist K3" },
      { eventId: event.id, positionId: pengawas.id, name: "Rudi Hartono", number: 3, vision: "Kepatuhan tanpa kompromi.", mission: "1. SOP digital\n2. Sanksi proporsional" },
    ],
  });

  // ── Peserta demo ──────────────────────────────────────────────
  const participants: { nik: string; name: string; division: string; uid: string }[] = [
    { nik: "EMP001", name: "Ahmad Fauzi", division: "Produksi", uid: "04A7B2C1D3" },
    { nik: "EMP002", name: "Bunga Permata", division: "HRD", uid: "04C3D4E5F6" },
    { nik: "EMP003", name: "Citra Kirana", division: "Keuangan", uid: "0455AA66BB" },
    { nik: "EMP004", name: "Dimas Anggara", division: "IT", uid: "0412345678" },
    { nik: "EMP005", name: "Eka Putri", division: "Logistik", uid: "" },
    { nik: "EMP006", name: "Fajar Nugroho", division: "Produksi", uid: "04998877AA" },
    { nik: "EMP007", name: "Gita Savitri", division: "Marketing", uid: "04BBCCDDEE" },
    { nik: "EMP008", name: "Hendra Gunawan", division: "IT", uid: "" },
    { nik: "EMP009", name: "Indah Sari", division: "Produksi", uid: "04DEADBEEF" },
    { nik: "EMP010", name: "Joko Susilo", division: "Logistik", uid: "04FEEDC0DE" },
    { nik: "EMP011", name: "Kartika Ayu", division: "HRD", uid: "04AA11BB22" },
    { nik: "EMP012", name: "Lukman Hakim", division: "Keuangan", uid: "04CC33DD44" },
  ];

  await prisma.participant.createMany({
    data: participants.map((p) => ({
      eventId: event.id,
      nik: p.nik,
      name: p.name,
      division: p.division,
      rfidUid: p.uid ? hashRfid(p.uid) : null,
    })),
  });

  console.log(`Seed selesai: event "${event.name}", 5 kandidat, ${participants.length} peserta.`);
  console.log(`Kartu RFID demo: 04A7B2C1D3 (EMP001), 04C3D4E5F6 (EMP002), dst. NIK demo: EMP001..EMP012.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
