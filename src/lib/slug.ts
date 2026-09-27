import "server-only";

/** Ubah teks jadi slug URL: "Pemilihan Ketua 2026" -> "pemilihan-ketua-2026" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // buang aksen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "event";
}

/** Pastikan slug unik; tambah suffix -2, -3, ... jika sudah dipakai. */
export async function uniqueSlug(base: string, excludeEventId?: string): Promise<string> {
  const { prisma } = await import("./db");
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  // Loop terbatas untuk keamanan; tabrakan jauh lebih jarang dari n kecil.
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeEventId) return candidate;
    candidate = `${root}-${n++}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}
