# ADR-Konsolidierung zum Projektstand

Stand: 13.05.2026

Ziel: Abgleich zwischen dokumentierten Architekturentscheidungen und aktueller Implementierung.

## Ergebnis auf einen Blick

- Weitgehend konsistent: ADR 0001, 0002, 0003, 0004, 0005, 0006, 0007, 0008, 0010, 0011, 0012, 0013, 0014
- Handlungsbedarf: ADR 0009
- In Umsetzung, aber noch nicht vollständig: ADR 0015 (Status bereits Proposed)

## Detailbewertung

### ADR 0001 bis ADR 0008

Empfehlung: Status beibehalten (Accepted).

Begründung:

- SPA mit Vue 3 + TypeScript ist umgesetzt.
- Build und statische Auslieferung sind umgesetzt.
- Browserseitige Datenverarbeitung, Pinia, Service-Layer und Grid-Nutzung sind vorhanden.
- Clientseitige Validierung ist im Projektkonzept und Codepfad verankert.

### ADR 0009 Fehlerhandling und Logging

Empfehlung: Entweder kurzfristig umsetzen oder ADR temporär auf Proposed setzen.

Ist-Abweichung:

- ADR fordert explizit ein zentrales Error-Handling inkl. Error-Service und Fehlerklassen.
- Im Code ist aktuell kein dedizierter zentraler Error-Service vorhanden.
- Fehlerbehandlung ist verteilt in Views, Stores und Services.

Vorschlag:

1. Error-Service einführen (zentrale Erfassung und Klassifikation).
2. Einheitliche Fehlertypen definieren (Netzwerk, Validierung, API, Parsing).
3. UI-Anzeige standardisieren (Toast/Banner + technische Detailansicht).
4. Danach ADR 0009 als erfüllt markieren.

### ADR 0010 bis ADR 0014

Empfehlung: Status beibehalten (Accepted).

Begründung:

- API-Kapselung ist implementiert.
- Basic-Auth-Verhalten entspricht der ADR (nur Laufzeitkontext, kein Persistieren von Credentials).
- Routing und Projektstruktur sind klar umgesetzt.
- Einheitliches Datenmodell mit Mapping ist vorhanden.

### ADR 0015 Import-Wizard

Empfehlung: Status vorerst Proposed beibehalten, Teilumsetzung transparent dokumentieren.

Ist-Lage:

- Wizard und zentrale Schritte sind bereits implementiert.
- Mehrere im ADR beschriebene Komfortfunktionen fehlen noch, z. B. Mapping-Profile, Undo/Redo, Dry-Run.

Vorschlag:

1. ADR 0015 um Abschnitt Teilumsetzung erweitern (Done/In Progress/Open).
2. Nach Umsetzung der Muss-Features Status auf Accepted anheben.

## Konkrete nächste Schritte

1. ADR 0009 priorisieren und zentralen Error-Service implementieren.
	Detaillierter Plan: ./ADR-0009-UMSETZUNGSPLAN.md
2. ADR 0015 in kleine umsetzbare Arbeitspakete schneiden.
3. Nach jedem Paket die ADR kurz aktualisieren, damit Doku und Code nicht auseinanderlaufen.
