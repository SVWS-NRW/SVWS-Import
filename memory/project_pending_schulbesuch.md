---
name: project-pending-schulbesuch
description: Offene Aufgaben im Schulbesuch-Import-Tab — aktuell keine offenen TODOs
metadata:
  type: project
---

## `vorigeAbschlussartBerufsbildend` — abgeschlossen (2026-06-10)

Alle 4 Punkte implementiert:

1. Feld `vorigeAbschlussartBerufsbildend: string` + Status `_vorigeAbschlussartBerufsbildendStatus` in `SchuelerSchulbesuchImportRow`
2. Alias-Mapping im `csvParser.ts` (Spaltenname `vorigeAbschlussartBerufsbildend` / `abschlussberufsbildend`)
3. API-Feld `schluesselAbschlussartBerufsbildendVorherigeSchule` wird im Store in `uploadAll` gesetzt — **nur wenn** die vorherige Schule Schulform BK oder SB hat
4. Grid-Spalte "Abschluss BBild. vor. Sch." in `SchuelerView.vue`

**Validierungslogik (Store `resolveAndValidate`):**
- `empty` — kein Wert in der CSV
- `ignored` — Wert vorhanden, aber vorherige Schule ist kein BK/SB → Feld wird nicht gesendet, kein Fehler
- `valid` — Wert ist in `SchulabschlussBerufsbildend` (einstellige Ziffer aus allinone.json)
- `invalid` — Wert nicht im Set → Validierungsfehler

**Schulformprüfung:** `schulenVerzeichnisMap` (SF-Schlüssel) + `schulformKuerzelMap` → Kürzel `BK` oder `SB`

**Kein offenes TODO mehr.**
