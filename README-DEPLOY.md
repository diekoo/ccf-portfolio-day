# CCF Portfolio Day — booking system (dag 2)

## Wat het is
- `/` — publieke boekingspagina: kies artiest → kies tijdslot (za 29 aug, 15:00–16:00, 10 min) → naam + e-mail. 6 artiesten × 6 slots = 36 plekken. Eén boeking per e-mailadres; dubbele slots onmogelijk (unique constraint).
- `/admin` — beheer: inloggen met admin key, per artiest zien wie waar staat, boekingen verwijderen en handmatig toevoegen (voor testen én voor de dag zelf).

## Deploy (Vercel)
1. Push deze code naar je repo (of laat Vercel de map importeren).
2. In het Vercel-project: **Storage → Create Database → Postgres** (Neon). Koppel aan dit project — de `POSTGRES_URL` env vars worden automatisch gezet.
3. **Settings → Environment Variables**: voeg `PD_ADMIN_KEY` toe (zelfgekozen wachtwoord voor /admin).
4. Deploy. De tabel `pd_bookings` wordt automatisch aangemaakt bij het eerste bezoek.

## Testen
- Boek via `/`, verwijder via `/admin`. Slots verversen elke 15 s op de publieke pagina.
- Artiesten of tijden wijzigen: `lib/config.ts` (één bestand).
