import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { ARTISTS, SLOTS, artistSlots, BOOKINGS_OPEN } from "@/lib/config";

export const dynamic = "force-dynamic";

// GET /api/bookings → availability map { artistId: { slot: true (taken) } }
export async function GET() {
  await ensureSchema();
  const { rows } = await sql`SELECT artist_id, slot FROM pd_bookings`;
  const taken: Record<string, Record<string, boolean>> = {};
  for (const r of rows) {
    (taken[r.artist_id] ||= {})[r.slot] = true;
  }
  return NextResponse.json({ taken });
}

// POST /api/bookings { artistId, slot, name, email }
export async function POST(req: NextRequest) {
  // closed here too, not just in the UI — a page left open must not still book
  if (!BOOKINGS_OPEN) {
    return NextResponse.json(
      { error: "Online booking is closed. Come to the info desk at BIRD and we'll sign you up there." },
      { status: 403 },
    );
  }
  await ensureSchema();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { artistId, slot, name, email } = body;

  if (!ARTISTS.some(a => a.id === artistId)) return NextResponse.json({ error: "Unknown artist" }, { status: 400 });
  if (!artistSlots(artistId).includes(slot)) return NextResponse.json({ error: "Unknown slot for this artist" }, { status: 400 });
  const cleanName = String(name || "").trim().slice(0, 120);
  const cleanEmail = String(email || "").trim().slice(0, 200).toLowerCase();
  if (cleanName.length < 2) return NextResponse.json({ error: "Please fill in your name" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ error: "Please fill in a valid email" }, { status: 400 });

  // one booking per email across the day — keeps it fair
  const existing = await sql`SELECT id FROM pd_bookings WHERE email = ${cleanEmail}`;
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "This email already has a booking. One review per person — see you Saturday!" }, { status: 409 });
  }

  try {
    await sql`INSERT INTO pd_bookings (artist_id, slot, name, email)
              VALUES (${artistId}, ${slot}, ${cleanName}, ${cleanEmail})`;
  } catch (e: any) {
    if (String(e?.message).includes("duplicate") || e?.code === "23505") {
      return NextResponse.json({ error: "That slot was just taken — pick another one." }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}
