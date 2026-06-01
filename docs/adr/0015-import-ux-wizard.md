# ADR 0015: Geführter Import-Wizard mit interaktivem Spalten-Mapping

## Status

Proposed

## Kontext

Der bisherige Importprozess (ADR 0003) legt den Fokus auf technische Verarbeitung im Browser,
adressiert aber nicht die Benutzerfreundlichkeit des Mapping-Schritts. In der Praxis importieren
Schulverwaltungsmitarbeitende Dateien, deren Spaltenbezeichnungen nicht standardisiert sind –
z. B. "Vorname", "Vn", "first_name" oder "Name 1" können denselben Inhalt meinen. Ein starres
Schema führt zu Fehlern oder Ablehnung. Ziel ist ein Workflow, der den Nutzer sicher durch jeden
Schritt führt, ohne technisches Vorwissen vorauszusetzen.

## Entscheidung

Einführung eines **fünfstufigen Import-Wizards**, der Datei-Upload, Vorschau, interaktives
Spalten-Mapping, Datenkorrektur und finalen Versand als klar getrennte Phasen umsetzt.

---

## UX-Konzept: Die fünf Schritte

### Schritt 1 — Datei-Upload

- Großflächige **Drag-&-Drop-Zone** mit visueller Hover-Animation
- Alternativ: klassischer "Datei auswählen"-Button
- Sofortige Anzeige von Dateiname, Größe und erkanntem Format (CSV / XLSX)
- Bei Excel: Auswahl des Tabellenblatts (Sheet-Picker) direkt nach dem Upload
- **Trennzeichen-Erkennung** bei CSV: automatisch, aber mit manueller Korrektur (`,` / `;` / `Tab`)
- Fortschrittsanzeige beim Einlesen großer Dateien

### Schritt 2 — Rohdaten-Vorschau ("Was wurde erkannt?")

- Darstellung der ersten **20–50 Zeilen** als scrollbare Tabelle ohne jegliches Mapping
- Kopfzeile: Toggle "Erste Zeile als Spaltenüberschrift verwenden" (Standard: ein)
- Spalten werden noch mit neutralen Labels angezeigt: `Spalte A`, `Spalte B` …
- Jede Spalte zeigt einen **Inhalt-Typ-Chip** (z. B. Text, Zahl, Datum), der automatisch erkannt wurde
- Der Nutzer sieht sofort, ob die Datei korrekt eingelesen wurde, bevor er Zeit ins Mapping investiert

### Schritt 3 — Interaktives Spalten-Mapping ("Was bedeutet was?")

Herzstück des Wizards. Zwei-Spalten-Layout:

**Linke Seite — Quellspalten**

Jede erkannte Quellspalte wird als **Karte** dargestellt:
```
┌─────────────────────────────────────┐
│ 📋 Spalte B            [Text]       │
│ Beispielwerte: Max, Anna, Klaus, …  │
│ → Zugewiesen als: [ Vorname      ▼] │
└─────────────────────────────────────┘
```
- Dropdown mit allen verfügbaren Zielfeldern des internen Datenmodells
- Option "Spalte ignorieren" für nicht benötigte Felder
- Visueller Indikator: grünes Häkchen (zugewiesen), grau (ignoriert), gelb (Warnung), rot (Pflichtfeld fehlt)

**Rechte Seite — Zielfelder (Pflicht & Optional)**

- Liste aller erwarteten Felder, gruppiert nach Kategorie (z. B. "Personaldaten", "Adresse", "Schulinformationen")
- Pflichtfelder werden mit `*` und rotem Rand hervorgehoben, solange nicht zugewiesen
- Jedes Zielfeld zeigt das aktuell zugewiesene Quellfeld als Badge

**Smart-Suggestion (heuristisches Auto-Mapping)**

Beim Laden von Schritt 3 wird ein **Auto-Mapping** per Heuristik vorgeschlagen:
- Normalisierter Textvergleich von Spaltenname zu Zielfeld-Name (Levenshtein-Distanz + Alias-Liste)
- Inhaltsbasierte Erkennung: Spalten mit Werten wie "10.03.2008" → wahrscheinlich Geburtsdatum
- Vorgeschlagene Mappings werden mit einem `Vorschlag`-Badge markiert und können übernommen oder geändert werden
- "Alle Vorschläge übernehmen"-Schaltfläche für schnelle Workflows

**Gespeicherte Mapping-Profile**

- Der Nutzer kann ein erfolgreiches Mapping als **Profil** speichern (Name + optionale Beschreibung)
- Beim nächsten Import mit ähnlicher Dateistruktur kann das Profil geladen werden
- Profilverwaltung (Bearbeiten, Löschen) im Einstellungsbereich der App

### Schritt 4 — Import-Vorschau & Inline-Korrektur ("Stimmt alles?")

- Vollständige tabellarische Darstellung der gemappten Daten im internen Datenmodell (vgl. ADR 0007)
- **Validierungsfeedback inline**:
  - Rote Zellen: Validierungsfehler (z. B. ungültiges Datum, leeres Pflichtfeld)
  - Gelbe Zellen: Warnungen (z. B. ungewöhnlich kurzer Name)
  - Tooltip mit konkreter Fehlermeldung bei Hover
- **Inline-Editing** aller Zellen direkt in der Vorschautabelle
- **Batch-Edit**: Mehrere Zeilen auswählen → gemeinsamen Feldwert setzen (z. B. alle auf Klasse "5a")
- **Undo / Redo**: Rückgängig-Kette für alle manuellen Änderungen
- Statistik-Leiste oben: `183 Zeilen · 2 Fehler · 5 Warnungen · 176 bereit`
- Filter: "Nur Fehler anzeigen" / "Nur Warnungen anzeigen"
- **Export-Option**: Korrigierte Daten als CSV herunterladen, ohne an den Server zu senden

### Schritt 5 — Versand ("Absenden")

- Zusammenfassung: Anzahl Datensätze, Zielendpunkt, gewähltes Mapping-Profil
- Explizite Bestätigung: "Ich möchte **183 Datensätze** an SVWS übertragen"
- Option: "Trockenlauf" (Dry Run) – Server validiert, schreibt aber nicht
- Fortschrittsanzeige während des Uploads (Batch-weise Übertragung)
- Ergebnis-Seite: Erfolgsanzahl, serverseitige Fehler (zeilenweise), erneuter Versuch für fehlgeschlagene Zeilen

---

## Wizard-Navigation

- **Stepper-Komponente** oben: Schritt 1–5 mit Status-Icon (✓ abgeschlossen, ● aktuell, ○ ausstehend)
- Jeder Schritt ist einzeln navigierbar, sobald er einmal abgeschlossen wurde (kein Sperren rückwärts)
- "Weiter"-Button ist deaktiviert, solange Pflichtfelder in Schritt 3 nicht zugewiesen sind
- Fortschritt wird im Pinia-Store gehalten (ADR 0006), sodass Seitenwechsel den Wizard nicht zurücksetzt
- Verlassen des Wizards öffnet einen Bestätigungsdialog ("Fortschritt verwerfen?")

---

## Technische Umsetzung (Überblick)

| Aspekt | Ansatz |
|---|---|
| Dateieinlesen | `papaparse` (CSV) + `xlsx` / `exceljs` (Excel), jeweils Web Worker |
| Auto-Mapping | Komposable `useColumnMatcher` mit Alias-Dictionary + Distanzberechnung |
| Mapping-Persistenz | `localStorage` über Pinia-Plugin, serialisierbar als JSON |
| Tabellen-Rendering | Bestehende Grid-Bibliothek (ADR 0007) mit editierbaren Zellen |
| Validierung | Wiederverwendung der Validierungslogik aus ADR 0008, pro Zelle reaktiv |
| Undo/Redo | Command-Pattern in Composable `useEditHistory` |

---

## Komponentenstruktur

```
views/
  ImportWizardView.vue          # Orchestrierung, Stepper
components/
  import/
    StepUpload.vue              # Schritt 1
    StepRawPreview.vue          # Schritt 2
    StepColumnMapping.vue       # Schritt 3
      ColumnCard.vue            # Quellspalten-Karte
      TargetFieldList.vue       # Zielfeld-Liste
    StepDataPreview.vue         # Schritt 4
    StepSend.vue                # Schritt 5
    WizardStepper.vue           # Navigation oben
composables/
  useColumnMatcher.ts           # Heuristik-Auto-Mapping
  useEditHistory.ts             # Undo/Redo
  useMappingProfiles.ts         # Profil-Persistenz
```

---

## Begründung

- **Wizard-Muster** reduziert kognitive Last: Nutzer sieht immer nur eine Aufgabe
- **Rohdaten-Vorschau** vor dem Mapping verhindert Frustration bei fehlerhaftem Einlesen
- **Spalten-Karten mit Beispielwerten** machen den Mapping-Schritt selbsterklärend
- **Auto-Mapping** beschleunigt den Workflow für erfahrene Nutzer erheblich
- **Inline-Korrektur** hält den gesamten Prozess in einer Oberfläche – kein externes Tool nötig
- **Mapping-Profile** sparen bei wiederkehrenden Quellen Zeit

## Alternativen

| Alternative | Ablehnung |
|---|---|
| Einmaliger Upload ohne Mapping-Schritt | Nicht flexibel genug für heterogene Quelldateien |
| Nur serverseitiges Mapping | Widerspricht ADR 0003 (clientseitige Verarbeitung) |
| Einfache Dropdown-Tabelle statt Karten | Beispielwerte für Nutzerentscheidung nicht sichtbar |
| Kein Profil-Speichern | Wiederkehrende Importe werden unnötig aufwändig |

## Konsequenzen

- Bestehender Importcode (ADR 0003) wird in `StepUpload` und `StepRawPreview` integriert, nicht ersetzt
- ADR 0014 (einheitliches Datenmodell) bleibt die Grundlage; das Mapping übersetzt Quellspalten in dieses Modell
- Validierungslogik (ADR 0008) wird in Schritt 4 pro Zelle reaktiv ausgeführt
- Mehraufwand: ~3–4 neue Komponenten + 3 Composables; dafür deutlich geringeres Nutzer-Fehlerpotenzial
- Mapping-Profile erfordern eine durchdachte Migration, falls sich das interne Datenmodell ändert
