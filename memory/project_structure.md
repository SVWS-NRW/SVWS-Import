---
name: SVWS-Import Projektstruktur
description: Tech-Stack, Dateistruktur, API-Endpunkte und Workflow der Vue 3 SPA
type: project
---

SPA für den Import von Schüler- und Lehrerdaten in den SVWS-Server NRW.

**Why:** Schulen brauchen einen einfachen Weg, Daten aus Fremdprogrammen (CSV/XLSX) in den SVWS-Server zu importieren.

**How to apply:** Beim Erweitern der App immer die bestehende Struktur nutzen; neue Datentypen nach dem Muster Schueler/Lehrer (Model + Store + View) anlegen.

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
  main.ts                   # App-Bootstrap mit Pinia, Router, PrimeVue
  App.vue                   # Shell mit Navigation und Toast
  router/index.ts           # Hash-Router: /connect, /import, /schueler, /lehrer
  models/
    Schueler.ts             # SchuelerNeu, SchuelerImportRow, schuelerImportToApi()
    Lehrer.ts               # LehrerStammdaten, LehrerImportRow, lehrerImportToApi()
  services/
    apiClient.ts            # Axios-Instanz, createApiClient/getApiClient/destroyApiClient
    svwsService.ts          # testConnection(), createSchueler(), createLehrer()
  stores/
    auth.ts                 # Verbindungsstatus, connect(), disconnect()
    schueler.ts             # Rows, validateAll(), uploadAll()
    lehrer.ts               # Rows, validateAll(), uploadAll()
  utils/
    csvParser.ts            # parseSchuelerCsv(), parseLehrerCsv(), normalisiereDatum()
    xlsxParser.ts           # parseSchuelerXlsx(), parseLehrerXlsx()
    idHelper.ts             # generateId() für lokale Zeilen-IDs
  views/
    ConnectView.vue         # Verbindungsmaske (URL, Schema, User, Passwort)
    ImportView.vue          # Dateiauswahl (Schüler/Lehrer, CSV/XLSX)
    SchuelerView.vue        # AG Grid Tabelle + Upload-Button
    LehrerView.vue          # AG Grid Tabelle + Upload-Button
  components/
    ImportStats.vue         # Zähler: Gesamt / Gültig / Fehler / Gesendet
```

## SVWS-API-Endpunkte
- `GET  /db/{schema}/lehrer` — Verbindungstest
- `POST /db/{schema}/schueler/create` — Body: SchuelerNeu, Response: SchuelerStammdaten
- `POST /db/{schema}/lehrer/create`   — Body: LehrerStammdaten, Response: LehrerStammdaten

## Workflow der App
1. /connect → Zugangsdaten eingeben → testConnection() gegen GET /lehrer
2. /import  → Dateiauswahl (Schüler oder Lehrer, CSV oder XLSX)
3. /schueler oder /lehrer → Tabelle bearbeiten, Fehler korrigieren
4. "Alles senden" → uploadAll() sendet jeden gültigen, noch nicht gesendeten Row
