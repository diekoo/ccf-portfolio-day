// Creative Cargo Festival — Portfolio Day (day 2) booking config
export const ARTISTS = [
  { id: "florent-lebrun",    name: "Florent Lebrun" },
  { id: "pierre-lazarevic",  name: "Pierre Lazarevic" },
  { id: "andree-wallin",     name: "Andrée Wallin" },
  { id: "lloyd-allan",       name: "Lloyd Allan" },
  { id: "lava-hijzelaar",    name: "Lava Hijzelaar" },
  { id: "antoine-collignon", name: "Antoine Collignon" },
] as const;

// Saturday 29 Aug 2026 · BIRD · reviews 15:00–16:00 (first hour of the day) · 10-minute slots
export const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let m = 15 * 60; m < 16 * 60; m += 10) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out; // 6 slots per artist
})();

export const EVENT = {
  title: "Portfolio Day",
  date: "Saturday 29 August 2026",
  venue: "BIRD, Raampoortstraat 24, Rotterdam",
  reviewMinutes: 8,
  slotMinutes: 10,
};
