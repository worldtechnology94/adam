/**
 * Shared Prisma client for Next.js (T1.4+).
 * Prisma 7 requires a driver adapter; we use @prisma/adapter-pg for PostgreSQL (Supabase).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase (and some other hosts) use a cert that triggers Node's "self-signed certificate
// in certificate chain". Relax TLS for this process so the API works when the dev server
// is started without NODE_TLS_REJECT_UNAUTHORIZED=0. Only applied when not already set.
if (url.includes("supabase.com") && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const adapter = new PrismaPg({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
