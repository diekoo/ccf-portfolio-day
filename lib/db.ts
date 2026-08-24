// DB layer: uses @vercel/postgres on Vercel (Neon), plain `pg` locally.
// Locally: set LOCAL_PG_URL=postgres://user@host:port/db, or run `vercel env pull` —
// @vercel/postgres refuses a direct connection string, so in dev we fall back to
// POSTGRES_URL_NON_POOLING over plain `pg`.
import { sql as vercelSql } from "@vercel/postgres";

type Q = { rows: any[] };
let localPool: any = null;

// `vercel env pull` writes "[SENSITIVE]" for vars marked sensitive in Vercel — never a usable URL.
const usable = (v?: string) => (v && v !== "[SENSITIVE]" ? v : undefined);

const directUrl = usable(process.env.LOCAL_PG_URL)
  || (process.env.NODE_ENV !== "production" ? usable(process.env.POSTGRES_URL_NON_POOLING) : undefined);

async function localQuery(text: string, params: any[]): Promise<Q> {
  if (!localPool) {
    const { Pool } = await import("pg");
    localPool = new Pool({ connectionString: directUrl });
  }
  return localPool.query(text, params);
}

export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<Q> {
  if (directUrl) {
    const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ""), "");
    return localQuery(text, values);
  }
  return vercelSql(strings, ...values);
}

export async function ensureSchema() {
  await sql`CREATE TABLE IF NOT EXISTS pd_bookings (
    id SERIAL PRIMARY KEY,
    artist_id TEXT NOT NULL,
    slot TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (artist_id, slot)
  )`;
}
