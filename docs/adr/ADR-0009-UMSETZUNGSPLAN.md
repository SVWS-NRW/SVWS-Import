# ADR 0009 Umsetzungsplan: Zentrales Fehlerhandling und Logging

Stand: 13.05.2026
Status: Arbeitsplan

Ziel: ADR 0009 so umsetzen, dass Fehlerbehandlung zentral, konsistent und testbar ist.

## Scope

Im Scope:

- Zentraler Error-Service mit einheitlicher Fehlerstruktur
- Fehlerklassifikation (API, Netzwerk, Validierung, Parsing, Unerwartet)
- Einheitliche UI-Ausgabe (Toast plus optionale Detailansicht)
- Migration der wichtigsten bestehenden Fehlerpfade

Nicht im Scope (später möglich):

- Externes Telemetrie-Backend
- Persistentes Client-Logging

## Architekturvorschlag

1. Fehlerdomäne in models:
   - src/models/AppError.ts
   - Typen: AppErrorType, AppErrorSeverity, AppErrorContext
2. Normalisierung in services:
   - src/services/errorService.ts
   - Kernfunktionen:
     - toAppError(input, context)
     - reportError(error)
     - reportInfo(message, context)
3. UI-Bridge:
   - Fehler in PrimeVue Toast ausgeben
   - Optional zusätzlich technische Detailanzeige in Help/Hilfe-View
4. Integrationspunkte:
   - API-Layer in src/services/apiClient.ts und src/services/svwsService.ts
   - Wizard-Flow in src/views/ImportWizardView.vue
   - Auth-Flow in src/stores/auth.ts

## Arbeitspakete

## Paket 1: Fehlerdomäne einführen

Deliverables:

- Neue Datei src/models/AppError.ts
- Einheitliche Struktur mit Pflichtfeldern:
  - id
  - type
  - severity
  - messageUser
  - messageTechnical
  - timestamp
  - context

Akzeptanzkriterien:

- TypeScript kompiliert ohne neue Fehler
- Typen sind ohne zyklische Imports nutzbar

## Paket 2: Error-Service implementieren

Deliverables:

- Neue Datei src/services/errorService.ts
- Mapping von unknown/axios/validation/parser Fehlern auf AppError
- Zentrale Erzeugung von IDs und Zeitstempeln

Akzeptanzkriterien:

- Für jede Fehlerquelle entsteht ein AppError
- Keine direkte String-Bastelei in den konsumierenden Views/Stores

## Paket 3: UI-Ausgabe vereinheitlichen

Deliverables:

- Einheitliche Toast-Ausgabe für severity und messageUser
- Optionaler Detailmodus (z. B. aufklappbar) für messageTechnical

Akzeptanzkriterien:

- Gleiche Fehlersprache und Severity-Mapping in Auth, Wizard und Upload
- Nutzer erhält verständliche Meldungen ohne Technikrauschen

## Paket 4: Bestehende Fehlerpfade migrieren

Priorität A:

- src/stores/auth.ts
- src/views/ImportWizardView.vue
- src/services/svwsService.ts

Priorität B:

- Legacy-Views (Schueler/Lehrer/Klassen/Jahrgaenge)
- Export-Flow

Akzeptanzkriterien:

- In Priorität A keine ad-hoc Fehlerstrings mehr ohne zentrale Normalisierung
- Fehler sind in der Konsole und im UI konsistent nachvollziehbar

## Paket 5: ADR und Doku nachziehen

Deliverables:

- docs/adr/0009-fehlerhandling-logging.md aktualisieren:
  - konkrete Architektur
  - Verweis auf errorService
  - statusgerechte Bewertung
- README Entwicklungsabschnitt kurz ergänzen (Error-Konzept)

Akzeptanzkriterien:

- ADR 0009 ist wieder deckungsgleich mit Implementierung

## Test- und Abnahmecheckliste

1. Ungültige Zugangsdaten in Connect-View erzeugen konsistente Fehlermeldung.
2. Offline/Timeout beim API-Request wird als Netzwerkfehler klassifiziert.
3. Parsing-Fehler bei defekter CSV/XLSX liefern nutzerfreundliche Meldung.
4. Validierungsfehler im Wizard erscheinen konsistent mit Severity.
5. Konsole enthält technische Details, UI primär nutzerorientierte Sprache.

## Reihenfolge und Aufwand (grobe Schätzung)

1. Paket 1 + 2: 0.5 bis 1 Tag
2. Paket 3: 0.5 Tag
3. Paket 4 Priorität A: 0.5 bis 1 Tag
4. Paket 5: 0.25 Tag

Gesamt: ca. 2 bis 3 Tage für erste vollständige ADR-0009-Erfüllung.

## Definition of Done

- Zentrale Fehlerstruktur und Error-Service produktiv verwendet
- Kernpfade (Auth, Wizard, API) migriert
- Konsistente UI-Fehlermeldungen vorhanden
- ADR 0009 aktualisiert und fachlich zutreffend
