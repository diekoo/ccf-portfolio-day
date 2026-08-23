import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { ARTISTS, SLOTS } from "@/lib/config";

export const dynamic = "force-dynamic";

function authed(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || "";
  return key.length > 0 && key === (process.env.PD_ADMIN_KEY || "");
}

// GET → full booking list
export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSchema();
  const { rows } = await sql`SELECT id, artist_id, slot, name, email, created_at FROM pd_bookings ORDER BY artist_id, slot`;
  return NextResponse.json({ bookings: rows });
}

// POST { artistId, slot, name, email } → add manually (skips one-per-email rule)
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSchema();
  const { artistId, slot, name, email } = await req.json();
  if (!ARTISTS.some(a => a.id === artistId) || !SLOTS.includes(slot))
    return NextResponse.json({ error: "Unknown artist or slot" }, { status: 400 });
  try {
    await sql`INSERT INTO pd_bookings (artist_id, slot, name, email)
              VALUES (${artistId}, ${slot}, ${String(name).trim()}, ${String(email || "").trim().toLowerCase()})`;
  } catch (e: any) {
    if (e?.code === "23505") return NextResponse.json({ error: "Slot already taken" }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}

// DELETE { id }
export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureSchema();
  const { id } = await req.json();
  await sql`DELETE FROM pd_bookings WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
