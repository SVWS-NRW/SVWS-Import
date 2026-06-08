---
name: SVWS-Import Projektstruktur
description: Tech-Stack, vollständige Dateistruktur, API-Endpunkte, beide Importpfade (Wizard & Legacy) und Erweiterungsanleitung
metadata:
  type: project
---

SPA für den Import von Schüler-, Lehrer-, Klassen-, Fächer- und Betriebsdaten aus CSV/XLSX in den SVWS-Server NRW (Schulverwaltungs-Webservice).

**Why:** Schulen brauchen einen einfachen Weg, Daten aus Fremdprogrammen (CSV/XLSX) in den SVWS-Server zu importieren — ohne Backend-Middleware, direkt im Browser.

**Zwei gleichwertige Importpfade, beide aktiv in Entwicklung:**
- **Wizard** (`/#/wizard`) — geführter 5-Schritte-Flow für Einsteiger, flexibles Spalten-Mapping für unbekannte Dateistrukturen
- **Import** (`/#/import`) — entitätsspezifische Views/Stores, direkter Zugriff, deckt Aufgaben ab die der Wizard (noch) nicht abbildet

**How to apply:** Für modulare neue Importtypen → `ImportModule` in `src/schemas/` anlegen und in `src/schemas/index.ts` registrieren (Wizard-Pfad). Für entitätsspezifische Sonderfunktionen → eigene View/Store im Import-Pfad.

## Tech-Stack
- Vue 3 + TypeScript + Vite (strict mode)
- Pinia (State Management, modulare Stores)
- Vue Router (Hash-History, für statisches Hosting ohne Server-Rewrite)
- Axios (HTTP-Client, Basic Auth im Arbeitsspeicher — nie persistent)
- AG Grid Community v32 (Tabellen mit Inline-Editing, Sortierung, Validierungsfeedback)
- PrimeVue v4 + Aura-Theme + PrimeIcons (UI-Komponenten)
- PapaParse (CSV-Parser, generisch)
- read-excel-file/browser (XLSX-Parser, kein npm-Vulnerability-Risiko)
- Electron (optional Desktop-Distribution: Linux AppImage, Windows NSIS)

## Vollständige Dateistruktur

```
src/
  main.ts                         # App-Bootstrap mit Pinia, Router, PrimeVue
  App.vue                         # Shell mit Navigation, Toast und Dark-Mode
  router/index.ts                 # Hash-Router mit requiresAuth-Guard

  models/                         # TypeScript-Typdefinitionen
    ImportSchema.ts               # FieldDefinition, ImportModule, MappedRow, ImportContext  ← Wizard-Kern
    ColumnMapping.ts              # ColumnAssignment, ColumnMapping, MappingProfile
    RawImportData.ts              # RawColumn, RawImportData (Rohdaten aus Datei)
    AppError.ts                   # Fehlertypen der Anwendung
    Schueler.ts                   # SchuelerNeu, SchuelerImportRow, schuelerImportToApi()  ← Legacy
    Lehrer.ts                     # LehrerStammdaten, LehrerImportRow, lehrerImportToApi()  ← Legacy
    Betriebe.ts                   # Legacy-Betriebsdaten
    Faecher.ts                    # Legacy-Fächerdaten
    Floskel.ts                    # Floskel-Typ
    Jahrgaenge.ts                 # Legacy-Jahrgangsdaten
    Klassen.ts                    # Legacy-Klassendaten
    Schule.ts                     # Schul-Stammdaten

  schemas/                        # Import-Modul-Definitionen (alle implementieren ImportModule)
    schuelerStammdatenSchema.ts   # 22 Felder, toApiPayload → SchuelerNeu
    lehrerStammdatenSchema.ts     # 22 Felder, toApiPayload → LehrerStammdaten
    betriebeSchema.ts             # Betriebe-Import
    faecherSchema.ts              # Fächer-Import
    jahrgaengeSchema.ts           # Jahrgänge-Import
    klassenSchema.ts              # Klassen-Import
    kurseSchema.ts                # Kurse-Import
    index.ts                      # Registry: importModules[], getModuleById(), getModulesByEntity()

  services/
    apiClient.ts                  # Axios-Instanz, createApiClient/getApiClient/destroyApiClient
    svwsService.ts                # testConnection(), createSchueler(), createLehrer(), ENTITY_ENDPOINTS
    columnMatcher.ts              # suggestMapping() — heuristisches Auto-Mapping (Alias + Levenshtein)
    mappingApplier.ts             # applyMapping(), revalidateRow() — Mapping → MappedRows
    katalogService.ts             # Stammdaten-Kataloge vom SVWS-Server laden
    errorService.ts               # Zentrales Fehler-Handling und Logging

  stores/
    auth.ts                       # Verbindungsstatus, connect(), disconnect()
    wizardStore.ts                # 5-Schritte-Wizard-State (upload→preview→mapping→edit→send)  ← Neu
    schueler.ts                   # Legacy: Rows, validateAll(), uploadAll()
    lehrer.ts                     # Legacy: Rows, validateAll(), uploadAll()
    betriebe.ts                   # Legacy-Store Betriebe
    faecher.ts                    # Legacy-Store Fächer
    jahrgaenge.ts                 # Legacy-Store Jahrgänge
    klassen.ts                    # Legacy-Store Klassen
    schule.ts                     # Store für Schul-Stammdaten

  utils/
    rawParser.ts                  # parseRawCsv(), parseRawXlsx() — generisch, kein Feldmapping  ← Wizard
    applyMapping.ts               # Mapping-Hilfslogik (Wizard-Pfad)
    csvParser.ts                  # Legacy: parseSchuelerCsv(), parseLehrerCsv(), normalisiereDatum()
    xlsxParser.ts                 # Legacy: parseSchuelerXlsx(), parseLehrerXlsx()
    idHelper.ts                   # generateId() für lokale Zeilen-IDs
    exportUtils.ts                # Export-Hilfslogik (CSV-Download)

  composables/
    useColumnMatcher.ts           # Heuristik-Auto-Mapping als Composable
    useDarkMode.ts                # Dark-Mode-Steuerung

  views/
    ConnectView.vue               # Verbindungsmaske (URL, Schema, User, Passwort)
    ImportWizardView.vue          # Wizard-Shell (ADR 0015)  ← Aktiv in Entwicklung
    ImportView.vue                # Legacy: Dateiauswahl (Schüler/Lehrer, CSV/XLSX)
    SchuelerView.vue              # Legacy: AG Grid Tabelle + Upload
    LehrerView.vue                # Legacy: AG Grid Tabelle + Upload
    BetriebeView.vue              # Betriebe-Ansicht
    FaecherView.vue               # Fächer-Ansicht
    FloskelView.vue               # Floskel-Ansicht
    HelpView.vue                  # Hilfe-Ansicht
    JahrgaengeView.vue            # Jahrgänge-Ansicht
    KlassenView.vue               # Klassen-Ansicht
    ExportView.vue                # Export-Funktion
    SchuljahresabschnitteView.vue # Schuljahresabschnitte

  components/
    ImportStats.vue               # Zähler: Gesamt / Gültig / Fehler / Gesendet
    ColumnMappingDialog.vue       # Dialog für Spalten-Mapping
    import/                       # Wizard-spezifische Step-Komponenten
      ColumnCard.vue              # Quellspalten-Karte (Schritt 3)
      StepColumnMapping.vue       # Schritt 3: Interaktives Spalten-Mapping
      StepDataPreview.vue         # Schritt 4: Datenvorschau + Inline-Korrektur
      StepSend.vue                # Schritt 5: Versand
      TargetFieldList.vue         # Zielfeld-Liste (Schritt 3)

examples/
  openAPI/
    server.json                   # OpenAPI-Beschreibung des SVWS-Servers
  schuelerdaten.csv               # Beispiel-Schülerdaten
  lehrkraefte.csv                 # Beispiel-Lehrerdaten
  klassen.csv                     # Beispiel-Klassendaten
  faecher.csv                     # Beispiel-Fächerdaten
  betriebe.csv                    # Beispiel-Betriebsdaten
  jahrgaenge.csv                  # Beispiel-Jahrgangsdaten
  Textbausteine-Beispiel.xlsx     # Beispiel XLSX

electron/
  main.cjs                        # Electron-Main-Process

docs/adr/                         # 15 Architecture Decision Records (ADR 0001–0015)
```

## SVWS-API-Endpunkte
- `GET  /db/{schema}/lehrer` — Verbindungstest (Auth-Check)
- `POST /db/{schema}/schueler/create` — Body: SchuelerNeu → SchuelerStammdaten
- `POST /db/{schema}/lehrer/create`   — Body: LehrerStammdaten → LehrerStammdaten
- Weitere Endpunkte in `services/svwsService.ts` → `ENTITY_ENDPOINTS`
- Vollständige OpenAPI-Definition: `examples/openAPI/server.json`

## Routing
- `/#/connect` — Einstiegspunkt (requiresAuth: false)
- `/#/wizard` — Wizard-Flow (requiresAuth: true)  ← bevorzugter Pfad
- `/#/import` — Legacy-Dateiauswahl (requiresAuth: true)
- `/#/schueler`, `/#/lehrer`, `/#/betriebe`, `/#/faecher`, `/#/klassen` — Legacy-Entitätsansichten
- Guard leitet ohne aktive Verbindung automatisch auf `/connect` zurück

## Auth-Ansatz (ADR 0011)
- Basic Auth via HTTP Authorization Header
- Credentials NUR im Arbeitsspeicher (Pinia auth-Store), NIEMALS im LocalStorage
- Nutzer muss pro Sitzung Credentials neu eingeben
- API-Client wird mit `createApiClient(baseUrl, credentials)` erzeugt

## Wizard-Ablauf (ADR 0015, in aktiver Entwicklung)
Zielgruppe: Einsteiger, unbekannte Dateistrukturen, flexibles Spalten-Mapping.
1. Modul wählen (z.B. "Schüler Stammdaten") + Datei hochladen → `rawParser.ts`
2. Rohdaten-Vorschau (Spaltentypen auto-erkannt, kein Mapping)
3. Spalten-Mapping: `columnMatcher.suggestMapping()` → heuristische Vorschläge, User korrigiert
4. `mappingApplier.applyMapping()` → MappedRows mit Inline-Editing & Validierung (AG Grid)
5. Versand: `ImportModule.toApiPayload()` konvertiert jede Zeile → API-Body

## Import-Workflow (unter /import, gleichwertig und aktiv)
Zielgruppe: Fortgeschrittene, bekannte Datenstrukturen, entitätsspezifische Sonderfunktionen.
1. `/connect` → Zugangsdaten → `testConnection()` gegen `GET /lehrer`
2. `/import` → Dateiauswahl (Entitätstyp + Format)
3. Entitätsansicht → Tabelle bearbeiten, Fehler korrigieren
4. "Alles senden" → `uploadAll()` sendet jeden gültigen, noch nicht gesendeten Row

## Erweiterung: Neues Import-Modul (Wizard-Pfad)
1. `src/schemas/meinModulSchema.ts` anlegen (implementiert `ImportModule`)
2. In `src/schemas/index.ts` in das `importModules`-Array eintragen
3. Wenn neuer SVWS-Endpunkt: `ENTITY_ENDPOINTS` in `svwsService.ts` ergänzen
4. Fertig — Wizard, columnMatcher und mappingApplier funktionieren automatisch

## Erweiterung: Neue Funktion im Import-Bereich
- Eigene View in `src/views/` anlegen
- Eigenen Pinia-Store in `src/stores/` anlegen
- Route in `src/router/index.ts` eintragen
- API-Calls ausschließlich über `src/services/`

## Wichtige Entscheidungsregeln
- Beide Pfade (Wizard + Import) werden parallel entwickelt — keiner ist deprecated
- TypeScript strict:true — keine impliziten any
- Clientseitige Validierung zuerst, Server-Fehler werden per Row zurückgespiegelt
- Keine Backendmiddleware — direkte Browser→SVWS-REST-Kommunikation
- API-Calls immer über `services/`, nie direkt in Komponenten
