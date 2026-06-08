# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Beispieldateien

Im Ordner `examples/` des Programmverzeichnisses befinden sich fertige Musterdateien, mit denen Sie die Import-Funktionen direkt ausprobieren können. Alle CSV-Dateien verwenden Semikolon als Trennzeichen und UTF-8 als Zeichensatz.

---

## Unterrichtsdaten

### `unterricht-klassen.csv`

**Verwendung:** Tab [Klassenunterricht](unterricht-klassenunterricht.md) in der Unterricht-Ansicht

Enthält Unterrichtsfächer für die Klassen 5a–10d eines vollständigen Schulhalbjahres (2025/2). Jede Zeile weist einer Klasse ein Fach mit Lehrkraft, Kursart und Wochenstunden zu. Beim Import werden alle aktiven Schüler der jeweiligen Klasse automatisch berücksichtigt.

**Spalten:**

| Spalte | Beispielwert | Erläuterung |
|--------|-------------|-------------|
| `schuljahr` | `2025` | Schuljahr (Anfangsjahr) |
| `abschnitt` | `2` | Halbjahr |
| `klasse` | `5a` | Klassenkürzel |
| `lehrerKuerzel` | `BIES` | Kürzel der unterrichtenden Lehrkraft |
| `kursart` | `PUK` | Kursart (z. B. `PUK` = Pflichtunterricht Klasse) |
| `fach` | `D` | Fachkürzel |
| `wochenstunden` | `4` | Wochenstunden |
| `aufszeugnis` | `true` | Fach erscheint auf dem Zeugnis |

**Auszug:**
```csv
"schuljahr";"abschnitt";"klasse";"lehrerKuerzel";"kursart";"fach";"wochenstunden";"aufszeugnis"
"2025";"2";"5a";"BIES";"PUK";"D";"4";"true"
"2025";"2";"5a";"BIES";"PUK";"M";"4";"true"
"2025";"2";"5b";"BILL";"PUK";"D";"4";"true"
```

---

### `unterricht-kurse.csv`

**Verwendung:** Tab [Kursunterricht](unterricht-kursunterricht.md) in der Unterricht-Ansicht

Enthält Religions- und Wahlpflichtkurse, die als separate Kurse in der Datenbank angelegt werden sollen. Die Datei zeigt verschiedene Kurstypen:
- Einzeljahrgangs-Kurse (z. B. Evangelische Religion für Jg. 5)
- Jahrgangsübergreifende Kurse (z. B. Sport-AG für Jg. 5–7)

**Spalten:**

| Spalte | Beispielwert | Erläuterung |
|--------|-------------|-------------|
| `schuljahr` | `2025` | Schuljahr |
| `abschnitt` | `2` | Halbjahr |
| `kuerzel` | `ER-05` | Eindeutiges Kurskürzel im Abschnitt |
| `lehrerkuerzel` | `BIES` | Kürzel der Kurslehrkraft |
| `kursart` | `PUT` | Kursart (z. B. `PUT` = Pflichtunterricht Teilungsgruppe) |
| `fach` | `ER` | Fachkürzel |
| `jahrgaenge` | `05` oder `05,06,07` | Zulässige Jahrgänge (kommagetrennt) |
| `zeugnisbezeichnung` | `evangelische Religionslehre` | Langtext auf dem Zeugnis |
| `wochenstunden` | `4` | Wochenstunden der Schüler |
| `wochenstundenlehrkraft` | `2` | Wochenstunden der Lehrkraft (kann abweichen) |
| `fortschreibungsart` | `komplett` | Automatische Weiterführung (`keine` / `jghoch` / `jghalten` / `komplett`) |
| `schienen` | _(leer)_ | Schienennummer für Stundenplanung |
| `istepochal` | `false` | Epochalunterricht? |

**Auszug:**
```csv
"schuljahr";"abschnitt";"kuerzel";"lehrerkuerzel";"kursart";"fach";"jahrgaenge";"zeugnisbezeichnung";"wochenstunden";"wochenstundenlehrkraft";"fortschreibungsart";"schienen";"istepochal"
"2025";"2";"ER-05";"BIES";"PUT";"ER";"05";"evangelische Religionslehre";"4";"4";"komplett";"";"false"
"2025";"2";"AG-Sport";"ARAU";"PUT";"SP";"05,06,07";"Abenteuer AG";"4";"2";"jghalten";"";"false"
```

---

### `unterricht-schueler.csv`

**Verwendung:** Tab [Schülerunterricht](unterricht-schuelerunterricht.md) in der Unterricht-Ansicht

Enthält individuelle Leistungsdaten für einzelne Schüler. Jede Zeile steht für einen Schüler und ein Fach. Die Datei zeigt, wie sowohl einfache Fachzuweisungen (ohne Kurs) als auch Kurszuweisungen (mit Kurs-Kürzel) abgebildet werden.

Schüler werden über **Nachname, Vorname und Geburtsdatum** eindeutig identifiziert.

**Spalten:**

| Spalte | Beispielwert | Erläuterung |
|--------|-------------|-------------|
| `nachname` | `Schneider` | Nachname des Schülers (exakt wie in SVWS) |
| `vorname` | `Uwe` | Vorname |
| `geburtsdatum` | `05.07.2006` | Geburtsdatum (Format TT.MM.JJJJ) |
| `schuljahr` | `2025` | Schuljahr |
| `abschnitt` | `2` | Halbjahr |
| `fach` | `M` | Fachkürzel |
| `fachlehrer` | `BIES` | Kürzel des Fachlehrers (optional) |
| `kurs` | `AG-Sport` | Kurskürzel, falls Kurszuweisung gewünscht (optional) |
| `kursart` | `PUK` | Kursart (optional) |
| `jahrgaenge` | `05,06,07` | Jahrgänge (optional, bei Kursen) |
| `note` | `1` | Zeugnisnote (optional) |
| `abiturfach` | _(leer)_ | Abiturfachnummer 1–4 (optional) |
| `wochenstd` | `4` | Wochenstunden (optional) |
| `externeschulnr` | _(leer)_ | Schulnummer bei Kooperationsunterricht (optional) |
| `zusatzkraft` | _(leer)_ | Kürzel einer Zusatzlehrkraft (optional) |
| `wochenstdzusatzkraft` | _(leer)_ | Wochenstunden der Zusatzkraft (optional) |
| `fehlstd` | `0` | Gesamte Fehlstunden (optional) |
| `unentschfehlstd` | `0` | Davon unentschuldigt (optional) |
| `mahnung` | _(leer)_ | Gemahnt? (`true`/`false`, optional) |
| `mahndatum` | _(leer)_ | Datum der Mahnung (optional) |

**Auszug:**
```csv
"nachname";"vorname";"geburtsdatum";"schuljahr";"abschnitt";"fach";"fachlehrer";"kurs";"kursart"
"Schneider";"Uwe";"05.07.2006";"2025";"2";"M";"BIES";"";"PUK"
"Güler";"Aslı";"01.07.2013";"2025";"2";"SP";"ASH";"AG-Sport";"PUT"
```

---

## Stammdaten

### `lehrkraefte.csv`

**Verwendung:** Import-Bereich → Lehrerdaten

Vollständige Lehrkräfteliste mit persönlichen Daten, Kürzel und Dienstbezeichnung. Diese Datei muss **vor** den Unterrichtsdaten importiert werden, da die Unterrichts-Tabs Lehrerkürzel aus der Datenbank auflösen.

**Wichtige Spalten:** `kuerzel`, `nachname`, `vorname`, `personalTyp` (z. B. `LEHRKRAFT`), `geschlecht` (3 = männlich, 4 = weiblich), `geburtsdatum` (Format JJJJ-MM-TT)

---

### `faecher.csv`

**Verwendung:** Import-Bereich → Fächer

Vollständiger Fächerkatalog der Schule. Enthält Kürzel, Langbezeichnungen, Zeugnis- und Statistik-Angaben sowie Flags (Fremdsprache, Oberstufenfach, Prüfungsrelevanz usw.).

**Wichtige Spalten:** `kuerzel`, `kuerzelStatistik`, `bezeichnung`, `bezeichnungZeugnis`, `istSichtbar`, `aufZeugnis`, `istFremdsprache`

---

### `jahrgaenge.csv`

**Verwendung:** Import-Bereich → Jahrgänge

Alle Jahrgänge der Schule (Klasse 5 bis Q2). Diese müssen vor Kursen importiert werden, da die Kurs-CSV Jahrgangskürzel referenziert.

**Wichtige Spalten:** `kuerzel` (z. B. `05`, `EF`, `Q1`), `bezeichnung`, `kuerzelStatistik`, `sortierung`

---

### `klassen.csv`

**Verwendung:** Import-Bereich → Klassen

Klassenliste für einen Schuljahresabschnitt mit Klassenlehrkraft, Jahrgang, Parallelität und Folge-/Vorgängerklasse. Muss für den Klassenunterricht-Import vorhanden sein.

**Wichtige Spalten:** `schuljahr`, `abschnitt`, `kuerzel`, `jahrgang`, `parallelitaet`, `folgeklasse`, `klassenlehrer`

---

### `schuelerdaten.csv`

**Verwendung:** Import-Bereich → Schülerdaten

Schüler-Stammdaten mit persönlichen Angaben, Adresse, Klasse, Staatsangehörigkeit und weiteren schulrelevanten Feldern. Schüler müssen vor dem Schülerunterricht-Import vorhanden sein.

**Wichtige Spalten:** `Nachname`, `Vorname`, `geburtsdatum`, `klasse`, `jahrgang`, `status`

---

### `betriebe.csv`

**Verwendung:** Import-Bereich → Betriebe (für berufsbildende Schulen)

Liste von Ausbildungsbetrieben und Praktikumsstellen mit Adress- und Kontaktdaten.

**Wichtige Spalten:** `name`, `branche`, `plz`, `ort`, `strasse`, `ausbildungsbetrieb`, `praktikumsplaetze`

---

### `ansprechpartner.csv`

**Verwendung:** Import-Bereich → Ansprechpartner (für Betriebe)

Kontaktpersonen zu den Betrieben aus `betriebe.csv`. Die Verknüpfung erfolgt über den Betriebsnamen (`betriebname`).

**Spalten:** `betriebname`, `anrede`, `name`, `rufname`, `telefon`, `email`

---

### `floskeln.csv`

**Verwendung:** Import-Bereich → Floskeln

Textbausteine (Floskeln) für Zeugnisse, ggf. mit Genderplatzhaltern (`&Er%Sie&`, `&Seine%Ihre&`). Können nach Fach, Niveau und Jahrgang gefiltert werden.

**Spalten:** `kuerzel`, `floskeltext`, `floskelgruppe`, `fach`, `niveau`, `jahrgang`

---

## PLZ-Dateien (Postleitzahlen)

Die drei PLZ-Dateien sind Hilfsdateien für die Adresspflege und werden nicht direkt importiert. Sie enthalten Orte und Ortsteile für bestimmte Regionen:

| Datei | Inhalt |
|-------|--------|
| `plz-ort-ortsteil-bi.csv` | PLZ, Ort und Ortsteile für Bielefeld und Umgebung |
| `plz-ort-ortsteil-w.csv` | PLZ, Ort und Ortsteile für Wuppertal und Umgebung |
| `plz-ort-ortsteile-d.csv` | PLZ, Ort und Ortsteile für Düsseldorf und Umgebung |

---

## Eigene Dateien vorbereiten

Die Musterdateien können als Vorlage für Ihre eigenen Daten verwendet werden:

1. Öffnen Sie die passende Musterdatei in Excel oder einem Texteditor
2. Passen Sie die Werte an Ihre Schule an (Kürzel, Namen, Abschnitte)
3. Speichern Sie als CSV mit **Semikolon** als Trennzeichen und **UTF-8** als Zeichensatz
4. Laden Sie die Datei in SVWS-Import

> **Hinweis:** Spaltenüberschriften können auch kleingeschrieben werden. Die Anwendung erkennt `LehrerKuerzel`, `lehrerkuerzel` und `lehrer` gleichwertig.

---


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="unterricht-kurszuweisung.html">« Kurszuweisung</a>
  <a href="../index.html">Inhaltsverzeichnis</a>
  <span></span>
</nav>
