# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Unterrichtsdaten importieren

## Ziel

Über die **Unterricht**-Ansicht lassen sich alle unterrichtsbezogenen Daten eines Schuljahresabschnitts in den SVWS-Server übertragen. Die Ansicht ist in vier Bereiche (Tabs) aufgeteilt, die aufeinander aufbauen:

| Tab | Was wird gemacht? | Typische Reihenfolge |
|-----|--------------------|----------------------|
| [Klassenunterricht](unterricht-klassenunterricht.md) | Weist allen Schülern einer Klasse Unterrichtsfächer zu | 1. |
| [Kursunterricht](unterricht-kursunterricht.md) | Legt neue Kurse (z. B. Religions- oder Wahlpflichtkurse) in der Datenbank an | 2. |
| [Schülerunterricht](unterricht-schuelerunterricht.md) | Importiert individuelle Leistungsdaten einzelner Schüler | 3. |
| [Kurszuweisung](unterricht-kurszuweisung.md) | Weist Schüler per Klick interaktiv Kursen zu | 4. |

---

## Voraussetzungen

Bevor Sie Unterrichtsdaten importieren, müssen folgende Stammdaten bereits im SVWS-Server vorhanden sein:

- **Lehrkräfte** mit ihrem Kürzel (z. B. über [Lehrerdaten anlegen](lehrerdaten-anlegen.md))
- **Fächer** mit ihrem Kürzel (z. B. über [Fächer anlegen](faecher-anlegen.md))
- **Klassen** für den gewählten Abschnitt (z. B. über [Klassen anlegen](klassen-anlegen.md))
- **Jahrgänge** (z. B. über [Jahrgänge anlegen](jahrgaenge-anlegen.md))
- **Schuljahresabschnitt** muss im SVWS-Server angelegt sein

Fehlt eine dieser Voraussetzungen, werden betroffene Zeilen in der Tabelle **rot** markiert und können nicht importiert werden.

---

## Schuljahresabschnitt wählen

Oben in der Ansicht befindet sich eine Auswahlliste **„Abschnitt wählen"**. Hier wählen Sie den Schuljahresabschnitt, für den Sie Unterrichtsdaten importieren möchten (z. B. „2025/2").

> **Tipp:** Wenn der SVWS-Server bereits verbunden ist, wird der aktuelle Abschnitt automatisch vorausgewählt.

---

## Allgemeiner Ablauf je Tab

1. **Datei laden** – Klicken Sie auf „Datei laden" und wählen Sie Ihre vorbereitete CSV-Datei aus.
2. **Referenzen prüfen** – Die Anwendung gleicht automatisch alle Einträge mit der Datenbank ab. Fehlende Abschnitte, Klassen, Lehrer oder Fächer werden sofort angezeigt.
3. **Tabelle kontrollieren** – Grüne Zeilen sind importbereit, rote Zeilen enthalten Fehler. Klicken Sie auf ein orange markiertes Feld, um den genauen Fehlerhinweis zu lesen.
4. **Import starten** – Klicken Sie auf „Importieren" (bzw. „Kurse anlegen"). Die Fortschrittsanzeige zeigt, wie viele Einträge bereits verarbeitet wurden.
5. **Ergebnis prüfen** – Nach dem Import sehen Sie, wie viele Einträge erfolgreich übertragen wurden und wie viele Fehler aufgetreten sind.

---

## Farbliche Markierungen in der Tabelle

| Farbe | Bedeutung |
|-------|-----------|
| Grün ✔ | Erfolgreich importiert |
| Gelb ● | Bereit zum Import (alle Referenzen aufgelöst) |
| Orange ⚠ | Warnung – z. B. Abschnitt aus CSV weicht vom gewählten Abschnitt ab |
| Rot ✖ | Fehler – Zeile wird nicht importiert, Details im Tooltip |
| Rot ⊗ | Doppelt – Kurs mit gleichen Eigenschaften existiert bereits |

---

## Unterstützte Dateiformate

- **CSV** (Semikolon `;`, Komma `,` oder Pipe `|` als Trennzeichen)
- **DAT** (wie CSV behandelt)
- **XLSX** (Excel)

Das Trennzeichen wird automatisch erkannt. Spaltenüberschriften dürfen groß oder klein geschrieben sein; alternative Bezeichnungen werden ebenfalls akzeptiert (z. B. `lehrer` statt `lehrerkuerzel`).

---

## Beispieldateien

Im Ordner `examples/` befinden sich fertige Musterdateien für alle Unterrichtstypen:

| Datei | Beschreibung |
|-------|--------------|
| `unterricht-klassen.csv` | Klassenunterricht für mehrere Klassen und Fächer |
| `unterricht-kurse.csv` | Religions- und Wahlpflichtkurse zum Anlegen |
| `unterricht-schueler.csv` | Individuelle Leistungsdaten einzelner Schüler |

Eine ausführliche Beschreibung aller Beispieldateien finden Sie unter [Beispieldateien](beispieldateien.md).

---


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="floskeln-importieren.md">« Floskeln importieren</a>
  <a href="../index.md">Inhaltsverzeichnis</a>
  <a href="unterricht-klassenunterricht.md">Klassenunterricht importieren »</a>
</nav>
