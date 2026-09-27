# VoteFrame — Sistem Voting Karyawan (RFID)

Website voting untuk pemilihan ketua, pengawas, dan posisi lainnya dengan alur:
**Event → Upload peserta (NIK + RFID) → Kiosk voting → Laporan anonim.**

## Fitur

- 🔐 **Login admin** (JWT, kredensial dari `.env`)
- 🗳️ **Event pemilihan** — tiap event punya posisi, kandidat, dan peserta sendiri
- 📌 **Multi-posisi** — satu kali vote memilih beberapa posisi (mis. Ketua *dan* Pengawas)
- 👥 **Peserta** — upload massal via file CSV/Excel (kolom: `nik, nama, divisi, rfid`)
  - RFID **disimpan sebagai hash SHA-256**, di UI hanya tampil ter-mask (`🔒 04A7••••D3`)
- 🖥️ **Kiosk voting** — dua tab: *Tab Kartu RFID* (auto-detect reader HID) atau *ketik NIK*
- 🔒 **Suara anonim** — ballot dipisah dari identitas peserta; NIK tidak bisa ditelusuri ke pilihan
- 📈 **Laporan** — hasil per posisi, tingkat partisipasi, export CSV (tanpa data pemilih)
- 📊 **Dashboard** — statistik & aktivitas vote terbaru
- 🐘 **PostgreSQL** — database via Prisma (`DATABASE_URL`)
- 🐳 **Docker** — siap `docker compose up` (app + Postgres)

## Menjalankan Lokal (tanpa Docker)

Butuh server **PostgreSQL** yang jalan (lokal atau hosted). Isi `DATABASE_URL` di `.env`,
contoh paling cepat pakai Postgres dari Docker:

```bash
docker run -d --name voteme-db -p 5432:5432 \
  -e POSTGRES_USER=voteme -e POSTGRES_PASSWORD=voteme -e POSTGRES_DB=voteme \
  postgres:16-alpine

npm install
npx prisma db push        # buat tabel di database PostgreSQL
npx tsx prisma/seed.ts    # data demo (event, kandidat, 12 peserta)
npm run dev
```

Buka <http://localhost:3000>.

- Admin: <http://localhost:3000/login> → `admin / admin123`
- Kiosk voting: <http://localhost:3000/vote>
- Papan hasil: <http://localhost:3000/results>

### Kartu demo

| NIK | Nama | RFID UID |
|---|---|---|
| EMP001 | Ahmad Fauzi | `04A7B2C1D3` |
| EMP002 | Bunga Permata | `04C3D4E5F6` |
| EMP003 | Citra Kirana | `0455AA66BB` |
| EMP004 | Dimas Anggara | `0412345678` |
| EMP006 | Fajar Nugroho | `04998877AA` |

Di kiosk, gunakan tab **Ketik NIK** (mis. `EMP001`) atau tab **RFID** lalu ketik UID + Enter
(simulasi reader yang mengetik otomatis).

## Menjalankan dengan Docker

```bash
docker compose up --build
```

Aplikasi jalan di <http://localhost:3000>. `docker compose` sekaligus menjalankan service
**PostgreSQL** (`db`) dengan data disimpan di volume `vote_db`, sehingga data bertahan saat
container di-recreate. Ganti `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, dan `AUTH_SECRET` di
`docker-compose.yml` untuk produksi.

## Format File Upload Peserta

CSV atau Excel dengan header fleksibel:

```csv
nik,nama,divisi,rfid
EMP013,Rina Marlina,Produksi,04AA22BB33
EMP014,Tono Prakoso,IT,
```

- Kolom `rfid` opsional — peserta tanpa kartu masih bisa vote via NIK.
- NIK duplikat otomatis dilewati; NIK yang sudah ada diperbarui.
- RFID yang sudah upload tidak pernah diekspor atau ditampilkan penuh.

## Privasi & Anonimitas

1. RFID disimpan sebagai SHA-256 hash — isi kartu tidak dapat dibaca dari database.
2. Tabel `Ballot` **tidak berelasi** ke peserta; pilihan disimpan di `BallotChoice` terpisah.
3. Halaman hasil & laporan hanya menampilkan agregat jumlah suara.
4. Peserta yang sudah vote ditandai boolean `hasVoted` saja.
