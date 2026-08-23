// DB layer: uses @vercel/postgres on Vercel (Neon), plain `pg` locally.
// Locally: set LOCAL_PG_URL=postgres://user@host:port/db
import { sql as vercelSql } from "@vercel/postgres";

type Q = { rows: any[] };
let localPool: any = null;

async function localQuery(text: string, params: any[]): Promise<Q> {
  if (!localPool) {
    const { Pool } = await import("pg");
    localPool = new Pool({ connectionString: process.env.LOCAL_PG_URL });
  }
  return localPool.query(text, params);
}

export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<Q> {
  if (process.env.LOCAL_PG_URL) {
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
