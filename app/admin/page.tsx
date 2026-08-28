"use client";
import { useEffect, useMemo, useState } from "react";
import { ARTISTS, SLOTS, artistSlots, slotBlock } from "@/lib/config";

const RED = "#D0293B", ORANGE = "#F29505", BEIGE = "#EDE3D7", BLACK = "#141414";

type Booking = { id: number; artist_id: string; slot: string; name: string; email: string; created_at: string };

export default function Admin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<{ artistId: string; slot: string; name: string; email: string }>({ artistId: ARTISTS[0].id, slot: SLOTS[0], name: "", email: "" });
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => { const k = sessionStorage.getItem("pdkey"); if (k) { setKey(k); tryLoad(k); } }, []);

  async function tryLoad(k: string) {
    setErr("");
    const r = await fetch("/api/admin", { headers: { "x-admin-key": k } });
    if (!r.ok) { setAuthed(false); setErr(r.status === 401 ? "Verkeerde sleutel" : "Fout bij laden"); return; }
    const d = await r.json();
    setBookings(d.bookings); setAuthed(true); sessionStorage.setItem("pdkey", k);
  }

  async function api(method: string, body: any) {
    setErr("");
    const r = await fetch("/api/admin", { method, headers: { "x-admin-key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); setErr(d.error || "Fout"); }
    tryLoad(key);
    return r.ok;
  }

  async function del(id: number) {
    if (!confirm("Boeking verwijderen?")) return;
    api("DELETE", { id });
  }

  async function add() {
    const ok = await api("POST", form);
    if (ok) setForm(f => ({ ...f, name: "", email: "" }));
  }

  function startEdit(b: Booking) { setEditing(b.id); setEditName(b.name); setEditEmail(b.email); }
  async function saveEdit(id: number) {
    const ok = await api("PATCH", { id, name: editName, email: editEmail });
    if (ok) setEditing(null);
  }

  async function moveTo(artistId: string, slot: string) {
    if (dragId == null) return;
    await api("PATCH", { id: dragId, artistId, slot });
    setDragId(null); setDragOver(null);
  }

  const byArtist = useMemo(() => {
    const m: Record<string, Booking[]> = {};
    for (const b of bookings) (m[b.artist_id] ||= []).push(b);
    return m;
  }, [bookings]);

  // export rows, in the running order of the day: block, then artist, then time
  const EXPORT_HEADER = ["Blok", "Artiest", "Tijd", "Naam", "E-mail", "Geboekt op"];
  const exportRows = useMemo(() => {
    const rows: string[][] = [];
    for (const a of ARTISTS) {
      for (const s of a.slots) {
        const b = (byArtist[a.id] || []).find(x => x.slot === s);
        if (!b) continue;
        const booked = b.created_at ? new Date(b.created_at).toLocaleString("nl-NL") : "";
        rows.push([String(slotBlock(s)), a.name, s, b.name, b.email || "", booked]);
      }
    }
    // bookings whose slot no longer fits the artist's block still need to show up
    const shown = new Set(rows.map(r => r[1] + "|" + r[2]));
    for (const b of bookings) {
      const a = ARTISTS.find(x => x.id === b.artist_id);
      const label = (a?.name ?? b.artist_id) + "|" + b.slot;
      if (shown.has(label)) continue;
      const booked = b.created_at ? new Date(b.created_at).toLocaleString("nl-NL") : "";
      rows.push(["buiten blok", a?.name ?? b.artist_id, b.slot, b.name, b.email || "", booked]);
    }
    return rows;
  }, [bookings, byArtist]);

  const [copied, setCopied] = useState(false);
  async function copyForSheets() {
    // tab-separated pastes straight into Google Sheets as columns
    const tsv = [EXPORT_HEADER, ...exportRows].map(r => r.join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErr("Kopiëren geblokkeerd door de browser — gebruik de CSV-knop.");
    }
  }

  function downloadCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [EXPORT_HEADER, ...exportRows].map(r => r.map(esc).join(",")).join("\r\n");
    // BOM keeps accented names readable when Excel opens the file
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-day-aanmeldingen.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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
      <h1 style={h1}>Portfolio Day — Admin <span style={{ color: RED }}>({bookings.length}/{ARTISTS.reduce((n, a) => n + a.slots.length, 0)})</span></h1>
      <p style={{ fontSize: 13, color: "#6a6156", margin: "4px 0 14px" }}>
        Verslepen = verplaatsen: pak een naam op en laat hem los op een ander (vrij) tijdstip — mag ook bij een andere artiest.
      </p>

      <section style={{ background: BEIGE, padding: 14, marginBottom: 22 }}>
        <b style={{ textTransform: "uppercase", fontSize: 13, letterSpacing: ".08em", color: RED }}>Handmatig toevoegen</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <select value={form.artistId} onChange={e => setForm(f => ({ ...f, artistId: e.target.value }))} style={input}>
            {ARTISTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={form.slot} onChange={e => setForm(f => ({ ...f, slot: e.target.value }))} style={input}>
            {artistSlots(form.artistId).map(s => <option key={s}>{s}</option>)}
          </select>
          <input placeholder="Naam" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={input} />
          <input placeholder="E-mail (optioneel)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={input} />
          <button onClick={add} style={btnBlack}>Toevoegen</button>
        </div>
        {err && <p style={{ color: RED, fontWeight: 700, margin: "8px 0 0" }}>{err}</p>}
      </section>

      <section style={{ background: BEIGE, padding: 14, marginBottom: 22 }}>
        <b style={{ textTransform: "uppercase", fontSize: 13, letterSpacing: ".08em", color: RED }}>Uitdraai</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
          <button onClick={copyForSheets} style={btnBlack}>
            {copied ? "Gekopieerd ✓" : "Kopieer voor Google Sheets"}
          </button>
          <button onClick={downloadCsv} style={{ ...btnBlack, background: "#6a6156" }}>Download CSV</button>
          <span style={{ fontSize: 13, color: "#6a6156" }}>
            {exportRows.length} aanmelding{exportRows.length === 1 ? "" : "en"}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "#6a6156", margin: "8px 0 0" }}>
          Kopiëren en dan in een leeg Google Sheet op cel A1 plakken (Ctrl+V) — de kolommen vallen vanzelf goed.
        </p>
      </section>

      {ARTISTS.map(a => (
        <section key={a.id} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, textTransform: "uppercase", borderBottom: `2px solid ${ORANGE}`, paddingBottom: 4 }}>
            {a.name} <span style={{ color: "#8a8378", fontSize: 12 }}>({a.slots[0]}–{a.slots[a.slots.length-1]})</span> <span style={{ color: RED }}>({(byArtist[a.id] || []).length}/{a.slots.length})</span>
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {a.slots.map(s => {
                const b = (byArtist[a.id] || []).find(x => x.slot === s);
                const cellKey = a.id + "|" + s;
                const isOver = dragOver === cellKey;
                return (
                  <tr key={s}
                    onDragOver={e => { if (dragId != null && !b) { e.preventDefault(); setDragOver(cellKey); } }}
                    onDragLeave={() => { if (isOver) setDragOver(null); }}
                    onDrop={e => { e.preventDefault(); if (!b) moveTo(a.id, s); }}
                    style={{ borderBottom: "1px solid #e3d9cb", background: isOver ? "#FBEED3" : undefined, outline: isOver ? `2px dashed ${ORANGE}` : undefined }}>
                    <td style={{ padding: "6px 8px", fontWeight: 800, width: 60 }}>{s}</td>
                    {b && editing === b.id ? (
                      <td colSpan={2} style={{ padding: "6px 8px" }}>
                        <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                          <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...input, padding: "5px 8px" }} placeholder="Naam" />
                          <input value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ ...input, padding: "5px 8px" }} placeholder="E-mail" />
                          <button onClick={() => saveEdit(b.id)} style={{ ...btnBlack, padding: "5px 12px", fontSize: 12 }}>Opslaan</button>
                          <button onClick={() => setEditing(null)} style={{ ...btnBlack, background: "#8a8378", padding: "5px 12px", fontSize: 12 }}>Annuleren</button>
                        </span>
                      </td>
                    ) : (
                      <>
                        <td draggable={!!b}
                          onDragStart={() => b && setDragId(b.id)}
                          onDragEnd={() => { setDragId(null); setDragOver(null); }}
                          style={{ padding: "6px 8px", cursor: b ? "grab" : undefined, opacity: dragId === b?.id ? .4 : 1 }}>
                          {b ? <span title="Sleep om te verplaatsen">⠿&nbsp; {b.name}</span> : <span style={{ color: "#b3a89a" }}>vrij</span>}
                        </td>
                        <td style={{ padding: "6px 8px", color: "#6a6156" }}>{b?.email}</td>
                      </>
                    )}
                    <td style={{ padding: "6px 8px", width: 88, textAlign: "right", whiteSpace: "nowrap" }}>
                      {b && editing !== b.id && <>
                        <button onClick={() => startEdit(b)} title="Wijzigen" style={{ ...btnBlack, padding: "4px 10px", fontSize: 12, marginRight: 6 }}>✎</button>
                        <button onClick={() => del(b.id)} title="Verwijderen" style={{ ...btnBlack, background: RED, padding: "4px 10px", fontSize: 12 }}>✕</button>
                      </>}
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
