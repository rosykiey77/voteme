#!/bin/sh
set -e

# Pastikan Prisma client ter-generate & schema ter-apply ke PostgreSQL
npx prisma generate --skip-validation 2>/dev/null || true
npx prisma db push --skip-generate

# Seed data demo hanya sekali (file penanda di volume)
mkdir -p /app/.seed
if [ ! -f /app/.seed/.seeded ]; then
  npx tsx prisma/seed.ts && touch /app/.seed/.seeded
fi

exec "$@"
