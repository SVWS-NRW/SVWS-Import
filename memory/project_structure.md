---
name: SVWS-Import Projektstruktur
description: Tech-Stack, Dateistruktur, API-Endpunkte und Workflow der Vue 3 SPA (inkl. Wizard-Architektur ADR 0015)
type: project
---

SPA für den Import von Schüler- und Lehrerdaten in den SVWS-Server NRW.

**Why:** Schulen brauchen einen einfachen Weg, Daten aus Fremdprogrammen (CSV/XLSX) in den SVWS-Server zu importieren.

**How to apply:** Neue Importtypen (z.B. Erzieherdaten, Lernabschnitte) werden als `ImportModule` in `src/schemas/` angelegt und in `src/schemas/index.ts` registriert — kein eigener Store oder eigener Parser nötig. Alter Weg (Model + Store + View) ist Legacy und wird nicht mehr erweitert.

## Tech-Stack
- Vue 3 + TypeScript + Vite
- Pinia (State Management)
- Vue Router (Hash-basiert, für statisches Hosting)
- Axios (HTTP, Basic Auth im Memory)
- AG Grid Community v32 (Tabellen mit Inline-Editing)
- PrimeVue v4 + Aura-Theme + PrimeIcons (UI-Komponenten)
- PapaParse (CSV-Parser)
- read-excel-file/browser (XLSX-Parser, sicher, keine npm-Vulnerabilities)

## Dateistruktur
```
src/
  main.ts                      # App-Bootstrap mit Pinia, Router, PrimeVue
  App.vue                      # Shell mit Navigation und Toast
  router/index.ts              # Hash-Router: /connect, /import, /wizard, /schueler, /lehrer

  models/                      # Daten-Typen
    ImportSchema.ts            # FieldDefinition, ImportModule, MappedRow, ImportContext  ← Wizard-Kern
    ColumnMapping.ts           # ColumnAssignment, ColumnMapping, MappingProfile
    RawImportData.ts           # RawColumn, RawImportData (Rohdaten aus Datei)
    Schueler.ts                # SchuelerNeu, SchuelerImportRow, schuelerImportToApi()  ← Legacy
    Lehrer.ts                  # LehrerStammdaten, LehrerImportRow, lehrerImportToApi()  ← Legacy

  schemas/                     # Import-Modul-Definitionen (erweiterbar)
    schuelerStammdatenSchema.ts  # 22 Felder inkl. toApiPayload → SchuelerNeu
    lehrerStammdatenSchema.ts    # 22 Felder inkl. toApiPayload → LehrerStammdaten
    index.ts                     # Registry: importModules[], getModuleById(), getModulesByEntity()

  services/
    apiClient.ts               # Axios-Instanz, createApiClient/getApiClient/destroyApiClient
    svwsService.ts             # testConnection(), createSchueler(), createLehrer()
    columnMatcher.ts           # suggestMapping() — heuristisches Auto-Mapping (Alias + Levenshtein)
    mappingApplier.ts          # applyMapping(), revalidateRow() — Mapping → MappedRows

  stores/
    auth.ts                    # Verbindungsstatus, connect(), disconnect()
    wizardStore.ts             # 5-Schritte-Wizard-State (upload→preview→mapping→edit→send)  ← Neu
    schueler.ts                # Legacy: Rows, validateAll(), uploadAll()
    lehrer.ts                  # Legacy: Rows, validateAll(), uploadAll()

  utils/
    rawParser.ts               # parseRawCsv(), parseRawXlsx() — generisch, kein Feldmapping  ← Neu
    csvParser.ts               # Legacy: parseSchuelerCsv(), parseLehrerCsv(), normalisiereDatum()
    xlsxParser.ts              # Legacy: parseSchuelerXlsx(), parseLehrerXlsx()
    idHelper.ts                # generateId() für lokale Zeilen-IDs

  views/
    ConnectView.vue            # Verbindungsmaske (URL, Schema, User, Passwort)
    ImportWizardView.vue       # Wizard-Shell (ADR 0015) — Implementierung folgt  ← Neu
    ImportView.vue             # Legacy: Dateiauswahl (Schüler/Lehrer, CSV/XLSX)
    SchuelerView.vue           # Legacy: AG Grid Tabelle + Upload-Button
    LehrerView.vue             # Legacy: AG Grid Tabelle + Upload-Button

  components/
    ImportStats.vue            # Zähler: Gesamt / Gültig / Fehler / Gesendet
```

## SVWS-API-Endpunkte
- `GET  /db/{schema}/lehrer` — Verbindungstest
- `POST /db/{schema}/schueler/create` — Body: SchuelerNeu, Response: SchuelerStammdaten
- `POST /db/{schema}/lehrer/create`   — Body: LehrerStammdaten, Response: LehrerStammdaten

## Wizard-Ablauf (ADR 0015, in Umsetzung)
1. `/wizard` Schritt 1 — Modul wählen (z.B. "Schüler Stammdaten"), Datei hochladen → `rawParser`
2. Schritt 2 — Rohdaten-Vorschau (was wurde eingelesen, Spaltentypen)
3. Schritt 3 — Spalten-Mapping: `columnMatcher.suggestMapping()` liefert Vorschläge, User korrigiert
4. Schritt 4 — `mappingApplier.applyMapping()` → MappedRows mit Inline-Editing & Validierung
5. Schritt 5 — Versand: `ImportModule.toApiPayload()` konvertiert jede Zeile → API-Body

## Legacy-Workflow (noch aktiv unter /import)
1. /connect → Zugangsdaten eingeben → testConnection() gegen GET /lehrer
2. /import  → Dateiauswahl (Schüler oder Lehrer, CSV oder XLSX)
3. /schueler oder /lehrer → Tabelle bearbeiten, Fehler korrigieren
4. "Alles senden" → uploadAll() sendet jeden gültigen, noch nicht gesendeten Row

## Erweiterung: Neues Import-Modul hinzufügen
1. Neue Datei `src/schemas/meinModulSchema.ts` anlegen (`implements ImportModule`)
2. In `src/schemas/index.ts` in das `importModules`-Array eintragen
3. Fertig — Wizard, columnMatcher und mappingApplier funktionieren automatisch
