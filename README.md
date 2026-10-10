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

- Node.js 22+ (erforderlich für Electron-Build; ältere Versionen funktionieren nur für den Web-Build)
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
- `npm run electron:dev` startet die App als Electron-Desktop-App im Entwicklungsmodus (nur Linux)
- `npm run electron:build` baut die Electron-App für die aktuelle Plattform (Linux → AppImage)
- `npm run electron:build:win` baut den Windows-Installer (`.exe` via NSIS) – erfordert `wine` auf Linux
- `npm run release [patch|minor|major]` erhöht die Version, baut Linux (AppImage), Windows (NSIS-Installer) und das Web-App-ZIP, pusht Commit und Tag und legt einen GitHub-Release-Entwurf an – siehe [Release erstellen](#release-erstellen)
- `npm run release:build` baut nur die Release-Dateien in `release/` (ohne Versionserhöhung und Upload)
- `npm run release:github` legt nur den GitHub-Release-Entwurf `v<version>` aus den vorhandenen Dateien in `release/` an

## Electron Desktop-App

Neben dem Betrieb als Web-App im Browser kann SVWS-Import auch als eigenständige Desktop-Anwendung ausgeliefert werden. Grundlage ist [Electron](https://www.electronjs.org/), das die Vue-SPA in einem Chromium-basierten Fenster ausführt – ohne dass ein separater Webserver oder Browser benötigt wird.

### Vorteile gegenüber dem reinen Browser-Betrieb

- Keine CORS-Probleme beim Zugriff auf den SVWS-Server (Electron umgeht Browser-Sicherheitsrestriktionen nicht, aber der Kontext ist kontrollierter)
- Einfache Verteilung als Installer ohne Serverinfrastruktur
- Vertrautes Desktop-Fenster für Endanwender

### Voraussetzungen für den Build

| Zielplattform | Build auf Linux | Zusatzanforderung |
|---|---|---|
| Linux (AppImage) | ✓ nativ | – |
| Windows (NSIS `.exe`) | ✓ Cross-Build | `wine` muss installiert sein |
| macOS (DMG) | ✗ | nur auf macOS möglich |

Auf Ubuntu/Debian kann `wine` wie folgt installiert werden:

```bash
sudo apt install wine
```

### Builds ausführen

```bash
# Nur Linux
npm run electron:build

# Nur Windows
npm run electron:build:win

# Linux + Windows + Web-App-ZIP (ohne Versionserhöhung und Upload)
npm run release:build
```

Die fertigen Pakete landen im Verzeichnis `release/`:

- `SVWS-Import-<version>.AppImage`
- `SVWS-Import-Setup-<version>.exe`
- `SVWS-Import-<version>-webapp.zip`

### Release erstellen

Voraussetzungen:

- `wine` ist installiert (für den Windows-Installer, siehe oben)
- die [GitHub CLI](https://cli.github.com/) ist angemeldet (`gh auth status`, sonst `gh auth login`)
- alle Änderungen sind committet und der Branch hat einen Upstream auf GitHub

Ein Befehl erledigt den kompletten Ablauf:

```bash
npm run release          # patch: 0.3.3 → 0.3.4
npm run release minor    # minor: 0.3.3 → 0.4.0
npm run release major    # major: 0.3.3 → 1.0.0
```

Die Flag-Schreibweise geht auch, braucht aber `--` davor, damit npm das Flag durchreicht: `npm run release -- --minor`.

Das Skript [scripts/release.mjs](scripts/release.mjs) führt nacheinander aus:

1. Prüfen der Voraussetzungen – bricht ab, bevor irgendetwas verändert wird
2. `npm version <patch|minor|major>` – erhöht die Version in `package.json` und `package-lock.json`, erzeugt Commit und Tag `v<version>`
3. `npm run release:build` – baut AppImage, Windows-Installer und Web-App-ZIP nach `release/`
4. `git push --follow-tags` – pusht Commit und Tag
5. `npm run release:github` – legt den Release-Entwurf „Release `<version>`“ mit den drei Dateien an (ohne Release-Notes)

Anschließend auf GitHub unter **Releases** den Entwurf öffnen, Release-Notes eintragen (z. B. über „Generate release notes“) und mit **Publish release** veröffentlichen.

Fehlerfälle:

- **Build schlägt fehl:** Commit und Tag der Versionserhöhung werden lokal zurückgenommen, es wurde nichts gepusht. Fehler beheben und denselben Befehl erneut ausführen.
- **Push oder Upload schlägt fehl:** Die Version ist bereits erhöht und die Dateien liegen in `release/`. Nach Behebung des Problems ohne neuen Build fortsetzen:

  ```bash
  git push --follow-tags
  npm run release:github
  ```

- **Release existiert bereits:** `gh` bricht ab, wenn es für die Version schon ein Release gibt (auch als Entwurf). Dann den Entwurf auf GitHub löschen und `npm run release:github` erneut ausführen.

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
  components/        Wiederverwendbare UI-Bausteine
  components/import/ Wizard-spezifische Schritt-Komponenten
  views/             Seiten (Routing-Ziele)
  stores/            Pinia-Stores (Auth, Wizard, Legacy-Entitäten)
  services/          API-Kommunikation, Kataloge, Mapping-Logik
  schemas/           ImportModule-Definitionen (modularer Ansatz)
  models/            Typdefinitionen und Entitätsmodelle
  utils/             Parser und Hilfsfunktionen
  router/            Vue-Router-Konfiguration

docs/adr/            Architecture Decision Records
examples/            Beispielimporte und lokale Testdaten
electron/            Electron-Main-Process (Desktop-Verteilung)
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
