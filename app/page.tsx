"use client";
import { useEffect, useMemo, useState } from "react";
import { ARTISTS, SLOTS, EVENT } from "@/lib/config";

const RED = "#D0293B", ORANGE = "#F29505", BEIGE = "#EDE3D7", BLACK = "#141414";
const GRAD = "linear-gradient(120deg,#F05123 0%,#D0293B 55%,#BE1E5E 100%)";

export default function Page() {
  const [taken, setTaken] = useState<Record<string, Record<string, boolean>>>({});
  const [artist, setArtist] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => fetch("/api/bookings").then(r => r.json()).then(d => setTaken(d.taken || {}));
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const freeCount = (id: string) => (ARTISTS.find(x => x.id === id)?.slots.length ?? 0) - Object.keys(taken[id] || {}).length;
  const selArtist = useMemo(() => ARTISTS.find(a => a.id === artist), [artist]);

  async function book() {
    if (!artist || !slot) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId: artist, slot, name, email }),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: `Booked! ${selArtist?.name} at ${slot}. See you Saturday — be there 5 minutes early.` });
      setSlot(null); setName(""); setEmail("");
    } else {
      setMsg({ ok: false, text: d.error || "Something went wrong" });
    }
    load();
  }

  return (
    <main style={{ minHeight: "100vh", background: GRAD, fontFamily: "'Archivo', system-ui, sans-serif", color: BLACK }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 60px", overflowWrap: "anywhere" }}>
        <img src="/ccf-logo.png" alt="Creative Cargo Festival" style={{ width: 150, display: "block" }} />
        <h1 style={{ color: "#fff", textTransform: "uppercase", fontSize: "clamp(38px,8vw,56px)", lineHeight: 0.95, letterSpacing: "-0.01em", margin: "18px 0 8px", fontWeight: 800 }}>
          {EVENT.title}<br />Reviews
        </h1>
        <p style={{ color: BEIGE, fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>{EVENT.date} · reviews 14:30–17:15</p>
        <p style={{ color: BEIGE, opacity: .9, margin: "0 0 28px" }}>{EVENT.venue} · {EVENT.reviewMinutes} minutes, one on one</p>

        {/* step 1: artist */}
        <Section n="1" title="Pick your reviewer">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(190px,100%),1fr))", gap: 10 }}>
            {ARTISTS.map(a => {
              const free = freeCount(a.id); const active = artist === a.id;
              return (
                <button key={a.id} onClick={() => { setArtist(a.id); setSlot(null); setMsg(null); }}
                  disabled={free === 0}
                  style={{ ...btn, background: active ? BLACK : "#fff", color: active ? "#fff" : BLACK,
                           opacity: free === 0 ? .45 : 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 800 }}>{a.name}</div>
                  <div style={{ fontSize: 11.5, color: "#6a6156" }}>{a.slots[0]}–{a.slots[a.slots.length-1].slice(0,2)}:{String(Number(a.slots[a.slots.length-1].slice(3))+10).padStart(2,"0")}</div>
                  <div style={{ fontSize: 12.5, color: active ? ORANGE : RED, fontWeight: 700 }}>
                    {free === 0 ? "Fully booked" : `${free} spots left`}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* step 2: slot */}
        {artist && (
          <Section n="2" title={`Pick a time with ${selArtist?.name}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))", gap: 8 }}>
              {(selArtist?.slots ?? []).map(s => {
                const isTaken = !!taken[artist]?.[s]; const active = slot === s;
                return (
                  <button key={s} onClick={() => { setSlot(s); setMsg(null); }} disabled={isTaken}
                    style={{ ...btn, padding: "10px 0", textAlign: "center", fontWeight: 800, fontSize: 15,
                             background: isTaken ? "rgba(255,255,255,.35)" : active ? BLACK : "#fff",
                             color: isTaken ? "#8a8378" : active ? ORANGE : BLACK,
                             textDecoration: isTaken ? "line-through" : "none" }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* step 3: details */}
        {artist && slot && (
          <Section n="3" title="Your details">
            <div style={{ display: "grid", gap: 10 }}>
              <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={input} />
              <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} />
              <button onClick={book} disabled={busy}
                style={{ ...btn, background: BLACK, color: "#fff", fontWeight: 800, fontSize: 16, padding: "14px 0", textTransform: "uppercase", letterSpacing: ".06em" }}>
                {busy ? "Booking…" : `Book ${slot} with ${selArtist?.name}`}
              </button>
            </div>
          </Section>
        )}

        {msg && (
          <div style={{ marginTop: 18, padding: "14px 16px", background: msg.ok ? BEIGE : BLACK,
                        color: msg.ok ? BLACK : "#fff", fontWeight: 700, borderLeft: `6px solid ${msg.ok ? RED : ORANGE}` }}>
            {msg.text}
          </div>
        )}

        <p style={{ color: BEIGE, opacity: .85, fontSize: 13, marginTop: 34, lineHeight: 1.5 }}>
          One review per person. Bring your portfolio on a tablet/laptop or printed.
          Miss your slot and it goes to the next person. Questions? Find us at the info desk.
        </p>
      </div>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ background: "#141414", color: "#F29505", width: 26, height: 26, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>{n}</span>
        <h2 style={{ color: "#fff", textTransform: "uppercase", fontSize: 16, letterSpacing: ".08em", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

const btn: React.CSSProperties = { border: "none", cursor: "pointer", padding: "12px 14px", fontFamily: "inherit", fontSize: 14 };
const input: React.CSSProperties = { border: "none", padding: "13px 14px", fontSize: 15, fontFamily: "inherit" };
