---
name: project-pending-schulbesuch
description: Offene Aufgaben im Schulbesuch-Import-Tab, die noch nicht implementiert sind
metadata:
  type: project
---

## `vorigeAbschlussartBerufsbildend` — API-Anbindung ausstehend

Das Feld `vorigeAbschlussartBerufsbildend` existiert bereits in:
- `examples/schueler-schulbesuch.csv` (Spalte vorhanden)
- `src/models/SchuelerSchulbesuch.ts` (Feld `vorigeAbschlussartID` deckt bisher nur allgemeinbildend ab — berufsbildend fehlt noch)

**Was noch fehlt:**
1. Eigenes Feld `vorigeAbschlussartBerufsbildend: string` ins Interface `SchuelerSchulbesuchImportRow`
2. Alias-Mapping im `csvParser.ts`
3. API-Feld in `schulbesuchImportToApiPatch` eintragen (Schlüssel aus SVWS-OpenAPI ermitteln)
4. Spalte in der ag-Grid-Tabelle in `SchuelerView.vue` anzeigen

**Why:** API-Schlüssel für den berufsbildenden Abschluss war zum Zeitpunkt der Implementierung noch nicht bekannt / nicht priorisiert.

**How to apply:** Wenn der Nutzer sagt "jetzt vorigeAbschlussartBerufsbildend fertigstellen", alle 4 Punkte oben abarbeiten.
