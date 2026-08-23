"use client";
import { useEffect, useMemo, useState } from "react";
import { ARTISTS, SLOTS } from "@/lib/config";

const RED = "#D0293B", ORANGE = "#F29505", BEIGE = "#EDE3D7", BLACK = "#141414";

type Booking = { id: number; artist_id: string; slot: string; name: string; email: string; created_at: string };

export default function Admin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<{ artistId: string; slot: string; name: string; email: string }>({ artistId: ARTISTS[0].id, slot: SLOTS[0], name: "", email: "" });

  useEffect(() => { const k = sessionStorage.getItem("pdkey"); if (k) { setKey(k); tryLoad(k); } }, []);

  async function tryLoad(k: string) {
    setErr("");
    const r = await fetch("/api/admin", { headers: { "x-admin-key": k } });
    if (!r.ok) { setAuthed(false); setErr(r.status === 401 ? "Verkeerde sleutel" : "Fout bij laden"); return; }
    const d = await r.json();
    setBookings(d.bookings); setAuthed(true); sessionStorage.setItem("pdkey", k);
  }

  async function del(id: number) {
    if (!confirm("Boeking verwijderen?")) return;
    await fetch("/api/admin", { method: "DELETE", headers: { "x-admin-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    tryLoad(key);
  }

  async function add() {
    setErr("");
    const r = await fetch("/api/admin", { method: "POST", headers: { "x-admin-key": key, "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) setErr(d.error || "Fout");
    else setForm(f => ({ ...f, name: "", email: "" }));
    tryLoad(key);
  }

  const byArtist = useMemo(() => {
    const m: Record<string, Booking[]> = {};
    for (const b of bookings) (m[b.artist_id] ||= []).push(b);
    return m;
  }, [bookings]);

  if (!authed) return (
    <main style={wrap}>
      <h1 style={h1}>Portfolio Day — Admin</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="password" placeholder="Admin key" value={key} onChange={e => setKey(e.target.value)} style={input} />
        <button onClick={() => tryLoad(key)} style={btnBlack}>Inloggen</button>
      </div>
      {err && <p style={{ color: RED, fontWeight: 700 }}>{err}</p>}
    </main>
  );

  return (
    <main style={wrap}>
      <h1 style={h1}>Portfolio Day — Admin <span style={{ color: RED }}>({bookings.length}/{ARTISTS.length * SLOTS.length})</span></h1>

      <section style={{ background: BEIGE, padding: 14, marginBottom: 22 }}>
        <b style={{ textTransform: "uppercase", fontSize: 13, letterSpacing: ".08em", color: RED }}>Handmatig toevoegen</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <select value={form.artistId} onChange={e => setForm(f => ({ ...f, artistId: e.target.value }))} style={input}>
            {ARTISTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={form.slot} onChange={e => setForm(f => ({ ...f, slot: e.target.value }))} style={input}>
            {SLOTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input placeholder="Naam" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={input} />
          <input placeholder="E-mail (optioneel)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={input} />
          <button onClick={add} style={btnBlack}>Toevoegen</button>
        </div>
        {err && <p style={{ color: RED, fontWeight: 700, margin: "8px 0 0" }}>{err}</p>}
      </section>

      {ARTISTS.map(a => (
        <section key={a.id} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, textTransform: "uppercase", borderBottom: `2px solid ${ORANGE}`, paddingBottom: 4 }}>
            {a.name} <span style={{ color: RED }}>({(byArtist[a.id] || []).length}/{SLOTS.length})</span>
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {SLOTS.map(s => {
                const b = (byArtist[a.id] || []).find(x => x.slot === s);
                return (
                  <tr key={s} style={{ borderBottom: "1px solid #e3d9cb" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 800, width: 60 }}>{s}</td>
                    <td style={{ padding: "6px 8px" }}>{b ? b.name : <span style={{ color: "#b3a89a" }}>vrij</span>}</td>
                    <td style={{ padding: "6px 8px", color: "#6a6156" }}>{b?.email}</td>
                    <td style={{ padding: "6px 8px", width: 40 }}>
                      {b && <button onClick={() => del(b.id)} style={{ ...btnBlack, background: RED, padding: "4px 10px", fontSize: 12 }}>✕</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}

const wrap: React.CSSProperties = { maxWidth: 860, margin: "0 auto", padding: "36px 20px", fontFamily: "'Archivo', system-ui, sans-serif", color: "#141414" };
const h1: React.CSSProperties = { textTransform: "uppercase", fontSize: 26, fontWeight: 800 };
const input: React.CSSProperties = { border: "1px solid #cfc5b6", padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: "#fff" };
const btnBlack: React.CSSProperties = { border: "none", cursor: "pointer", background: "#141414", color: "#fff", fontWeight: 800, padding: "9px 16px", fontFamily: "inherit", textTransform: "uppercase", fontSize: 13, letterSpacing: ".05em" };
