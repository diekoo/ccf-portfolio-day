// Creative Cargo Festival — Portfolio Day (day 2) booking config
// Saturday 29 Aug 2026 · BIRD · sessions 14:30–18:00 · 45 min per artist, tables in parallel
// Block 1: 14:30–15:15 · Block 2: 15:30–16:15 · Block 3: 16:30–17:15 (10-minute slots, 4 per artist)
// 7 artists: 2 tables in blocks 1 and 3, 3 tables in block 2.

const B1 = ["14:30", "14:40", "14:50", "15:00"];
const B2 = ["15:30", "15:40", "15:50", "16:00"];
const B3 = ["16:30", "16:40", "16:50", "17:00"];

export const ARTISTS: { id: string; name: string; slots: string[] }[] = [
  { id: "florent-lebrun",    name: "Florent Lebrun",    slots: B1 },
  { id: "pierre-lazarevic",  name: "Pierre Lazarevic",  slots: B1 },
  { id: "andree-wallin",     name: "Andrée Wallin",     slots: B2 },
  { id: "lloyd-allan",       name: "Lloyd Allan",       slots: B2 },
  { id: "aly-farroukh",      name: "Aly Farroukh",      slots: B2 },
  { id: "lava-hijzelaar",    name: "Lava Hijzelaar",    slots: B3 },
  { id: "antoine-collignon", name: "Antoine Collignon", slots: B3 },
];

// all distinct slot times (for admin dropdowns); per-artist validity is checked via ARTISTS[].slots
export const SLOTS: string[] = [...B1, ...B2, ...B3];

export function artistSlots(id: string): string[] {
  return ARTISTS.find(a => a.id === id)?.slots ?? [];
}

export const EVENT = {
  title: "Portfolio Day",
  date: "Saturday 29 August 2026",
  venue: "BIRD, Raampoortstraat 24, Rotterdam",
  reviewMinutes: 8,
  slotMinutes: 10,
};
