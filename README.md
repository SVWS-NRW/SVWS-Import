# SVWS-Import

Web-Client zum Import von Schulverwaltungsdaten in den SVWS-Server.

Dieses README ist bewusst auf Entwickler ausgerichtet (Setup, Architektur, Erweiterung, Betrieb).
Die Anwenderdokumentation entsteht separat unter `docs/`.

## Ziel und Kontext

Die Anwendung importiert Daten (derzeit v. a. Schüler-, Lehrer-, Klassen- und Jahrgangsbezug) aus CSV/XLSX in den SVWS-Server.

Leitgedanken aus den ADRs:

- SPA im Browser mit Vue 3 + TypeScript
- Keine zusätzliche Backend-Middleware
- Direkte REST-Kommunikation mit SVWS via Basic Auth
- Clientseitige Verarbeitung, Mapping und Validierung
- Modulare Struktur mit Services, Stores und Schemas

## Projektstatus

Es existieren aktuell zwei Importpfade:

- Legacy-Flow (`/import` + entitätsspezifische Views/Stores)
- Wizard-Flow (`/wizard`) mit modularem Importansatz

Der Wizard ist implementiert und in aktiver Weiterentwicklung. ADR 0015 ist noch als `Proposed` markiert, wird aber bereits technisch umgesetzt.

## Tech-Stack

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router (Hash-History)
- Axios
- PrimeVue + PrimeIcons
- AG Grid Community
- PapaParse (CSV)
- read-excel-file (XLSX)

## Voraussetzungen

- Node.js 20+ (empfohlen)
- npm 10+ (empfohlen)
- Zugriff auf einen erreichbaren SVWS-Server mit gültigen Zugangsdaten

## Schnellstart

```bash
npm install
npm run dev
```

Die App läuft dann im Vite-Dev-Server (Standard: `http://localhost:5173`).

## NPM-Skripte

- `npm run dev` startet den Entwicklungsserver
- `npm run build` führt Typecheck (`vue-tsc`) und Production-Build aus
- `npm run preview` startet eine lokale Vorschau des Build-Ergebnisses

## Build und Auslieferung

Die Auslieferung erfolgt als statisches Bundle im Verzeichnis `dist/`.

```bash
npm run build
npm run preview
```

Wichtige Build-Eigenschaften:

- Vite-Basispfad ist auf relative Pfade gesetzt (`base: './'`)
- Router nutzt Hash-History, damit statisches Hosting ohne Server-Rewrite funktioniert
- Output wird als statische Dateien ausgeliefert (`index.html`, Assets)

## Architekturüberblick

### Frontend-Architektur

- SPA mit Vue-Komponenten (`views/`, `components/`)
- zentrale Zustände über Pinia-Stores (`stores/`)
- API-Kapselung über Service-Layer (`services/`)
- internes Datenmodell und modulare Importdefinition (`models/`, `schemas/`)

### Routing

- Einstieg über `/#/connect`
- geschützte Routen mit `meta.requiresAuth`
- Guard leitet ohne aktive Verbindung auf `connect` zurück

### API und Auth

- API-Client wird zur Laufzeit erzeugt (`createApiClient`)
- Basic-Auth-Header wird aus den eingegebenen Credentials gesetzt
- Credentials werden nicht persistent gespeichert (nur im Laufzeitkontext)

## Verzeichnisstruktur (relevant für Entwicklung)

```text
src/
	components/      Wiederverwendbare UI-Bausteine
	components/import/
									 Wizard-spezifische Schritt-Komponenten
	views/           Seiten (Routing-Ziele)
	stores/          Pinia-Stores (Auth, Wizard, Legacy-Entitäten)
	services/        API-Kommunikation, Kataloge, Mapping-Logik
	schemas/         ImportModule-Definitionen (modularer Ansatz)
	models/          Typdefinitionen und Entitätsmodelle
	utils/           Parser und Hilfsfunktionen
	router/          Vue-Router-Konfiguration

docs/adr/          Architecture Decision Records
examples/          Beispielimporte und lokale Testdaten
memory/            Projektskizze/Arbeitsnotizen zur Struktur
```

## Importkonzepte im Code

### 1) Wizard (modular, bevorzugter Ausbau)

Der Wizard führt in fünf Schritten durch den Import:

1. Modul + Datei wählen
2. Rohdatenvorschau
3. Spalten-Mapping
4. Datenprüfung/Inline-Korrektur
5. Versand

Kernbausteine:

- `stores/wizardStore.ts` für Ablauf- und Zustandssteuerung
- `schemas/*.ts` als deklarative ImportModule-Definitionen
- `utils/rawParser.ts` für formatunabhängiges Einlesen
- `services/columnMatcher.ts` für Mapping-Vorschläge
- `utils/applyMapping.ts` für Überführung in interne Datensätze
- `components/import/*` für Schritt-UI

### 2) Legacy-Flow (weiterhin vorhanden)

Der ältere Pfad importiert entitätsspezifisch über eigene Views/Stores (z. B. Schüler/Lehrer) und bleibt aktuell für bestehende Prozesse nutzbar.

## Neues Importmodul hinzufügen

Empfohlener Weg über `schemas/`:

1. Neues Schema in `src/schemas/` anlegen (gemäß `ImportModule`)
2. In `src/schemas/index.ts` registrieren
3. Felddefinitionen inkl. Validierungsregeln und `toApiPayload` ergänzen
4. Modul im Wizard auswählen und End-to-End testen

Wenn ein neuer Entitätstyp einen neuen SVWS-Endpunkt benötigt:

1. Endpoint-Zuordnung in `services/svwsService.ts` (`ENTITY_ENDPOINTS`) ergänzen
2. Payload-Mapping prüfen
3. Fehlerfälle (4xx/5xx) im Wizard-Upload testen

## Fehlerhandling und Validierung

- Validierung ist primär clientseitig (Schema + Fachlogik)
- Fehler werden in der UI sichtbar gemacht
- Technisches Logging erfolgt in der Browser-Konsole
- Serverseitige Validierungsfehler werden pro Datensatz zurück in den Workflow gespiegelt

## Entwicklungsprinzipien

- UI, Geschäftslogik und API-Kommunikation sauber trennen
- Neue Features bevorzugt im Wizard-/Schema-Modell umsetzen
- Legacy-Code nur gezielt anfassen (Bugfixing/Kompatibilität)
- Typen strikt halten (TypeScript `strict: true`)

## ADR-Übersicht

Die Architekturentscheidungen sind in `docs/adr/` dokumentiert:

- 0001 SPA mit Vue + TypeScript
- 0002 Build & statische Auslieferung
- 0003 Browserseitige Datenverarbeitung
- 0004 SVWS-REST-Integration
- 0005 Komponentenstruktur
- 0006 Pinia State Management
- 0007 Tabellen-Rendering
- 0008 Validierungsstrategie
- 0009 Fehlerhandling & Logging
- 0010 API-Kapselung
- 0011 Basic Auth Handling
- 0012 Projektstruktur/Modularisierung
- 0013 Routing
- 0014 Einheitliches Datenmodell
- 0015 Import-Wizard UX (Proposed, in Umsetzung)

## Hinweise für Beiträge

- Kleine, klar abgegrenzte Pull Requests bevorzugen
- Bei Struktur- oder Architekturänderungen passende ADR ergänzen/aktualisieren
- Bei neuen Importfeldern immer mit Beispiel-Dateien aus `examples/` gegenprüfen

## Lizenz

Siehe `LICENSE`.
