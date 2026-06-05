---
name: SVWS-Import ADR-Entscheidungen
description: Zusammenfassung der 15 Architecture Decision Records — Kern-Entscheidungen, Begründungen und Konsequenzen für tägliche Entwicklung
metadata:
  type: project
---

Alle ADRs unter `docs/adr/`. Alle Status "Accepted" außer ADR-0015 (Proposed, aber bereits technisch umgesetzt).

**Why:** Diese Entscheidungen prägen, wie Code strukturiert sein muss. Abweichungen erfordern ein neues ADR.

**How to apply:** Vor jeder strukturellen Änderung diese Entscheidungen kennen. Bei Architekturänderungen ein neues ADR anlegen oder bestehendes aktualisieren.

## Kern-Entscheidungen (nicht verhandelbar)

| ADR  | Entscheidung | Begründung |
|------|-------------|------------|
| 0001 | Vue 3 + TypeScript als SPA | Wartbarkeit, Typsicherheit, gutes Tooling |
| 0002 | Statisches Bundle (kein Server) | Serverloser Deploy, beliebiges Hosting |
| 0003 | Datenverarbeitung vollständig im Browser | Datenschutz, Offline-Vorbereitung, keine Serverlatenz |
| 0004 | REST-Kommunikation direkt Browser→SVWS | Keine Middleware, SVWS hat REST-API |
| 0006 | Pinia für State Management | Vue-3-Standard, TypeScript-Support, modulare Stores |
| 0007 | AG Grid für tabellarische Darstellung | Inline-Editing, Validierung, Performance bei großen Datensätzen |
| 0011 | Basic Auth NUR im Arbeitsspeicher | Sicherheit: kein LocalStorage, keine Persistenz |
| 0013 | Hash-History-Router | Statisches Hosting ohne Server-Rewrite |

## Wichtige Konsequenzen für die Entwicklung

### Keine Backend-Middleware (ADR 0003, 0004)
- CORS muss am SVWS-Server konfiguriert sein
- Browser sendet Basic-Auth-Header direkt an SVWS
- Keine serverseitige Verarbeitung möglich

### Clientseitige Validierung (ADR 0008)
- Schema-basiert + Fachlogik
- Doppelte Validierung (Client + Server) ist gewünscht
- Serverseitige Fehler werden pro Row zurückgespiegelt

### Service-Layer Pflicht (ADR 0010)
- Alle API-Aufrufe AUSSCHLIESSLICH über `services/`
- Direkte Axios-Calls in Komponenten verboten
- Schlüsseldateien: `apiClient.ts`, `svwsService.ts`

### Fehlerhandling zentral (ADR 0009)
- Alle Fehler über `errorService.ts` routen
- Anzeige in der UI, Logging in Browser-Konsole
- Fehlerklassen in `models/AppError.ts`

## ADR-0015: Import-Wizard (Proposed → bereits umgesetzt)
- 5-Schritte-Wizard: Upload → Rohdaten-Vorschau → Spalten-Mapping → Inline-Korrektur → Versand
- Auto-Mapping via Levenshtein-Distanz + Alias-Dictionary (`columnMatcher.ts`)
- Mapping-Profile persistent im LocalStorage (Ausnahme von ADR-0011, nur Mapping-Metadaten, keine Credentials)
- Undo/Redo für manuelle Änderungen (Command-Pattern in Composable)
- Stepper-Navigation: abgeschlossene Schritte rückwärts navigierbar
- Verlassen des Wizards mit Bestätigungsdialog

## Parallele Entwicklung beider Pfade
- **Wizard** (`/#/wizard`): Einsteigerfreundlich, geführter Flow, flexibles Spalten-Mapping — aktiv entwickelt
- **Import** (`/#/import`): Entitätsspezifische Ansichten, Direktzugriff, Sonderfunktionen — aktiv entwickelt
- Beide Pfade sind gleichwertig; keiner ist deprecated oder ein Auslaufmodell
- `rawParser.ts` ist der neue generische Parser (Wizard); `csvParser.ts`/`xlsxParser.ts` bedienen den Import-Pfad
- StepUpload.vue und StepRawPreview.vue fehlen noch in `components/import/` (TODO im Wizard)
