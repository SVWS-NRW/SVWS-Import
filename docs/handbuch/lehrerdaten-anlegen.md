# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Lehrerdaten anlegen


## Ziel

Lehrkräfte mit persönlichen Daten und Kürzel über eine CSV- oder XLSX-Datei in SVWS anlegen. Das Lehrerkürzel wird in allen Unterrichts-, Klassen- und Kursimporten als Referenz verwendet – dieser Import sollte deshalb früh erfolgen.

## Schritte

1. Öffnen Sie die Kachel **Lehrerdaten** im Import-Bereich.
2. Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV- oder XLSX-Datei.
3. Prüfen Sie die Vorschautabelle auf korrekte Spaltenerkennung.
4. Führen Sie das Spalten-Mapping durch.
5. Korrigieren Sie rot markierte Pflichtfelder.
6. Klicken Sie auf **„Importieren"** und prüfen Sie das Ergebnis.

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `kuerzel` | Eindeutiges Lehrerkürzel | `AMMO` |
| `nachname` | Nachname der Lehrkraft | `Ammon` |
| `vorname` | Vorname | `Sabine` |

### Persönliche Daten (optional)

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `personalTyp` | Art des Personals | `LEHRKRAFT` |
| `anrede` | Anrede | `Frau` |
| `titel` | Akademischer Titel | `Dr.` |
| `amtsbezeichnung` | Dienstbezeichnung | `STD` |
| `geschlecht` | `3` = männlich, `4` = weiblich | `4` |
| `geburtsdatum` | Geburtsdatum im Format JJJJ-MM-TT | `1991-06-18` |
| `staatsangehoerigkeit` | Staatsangehörigkeitsschlüssel | `000` |

### Adress- und Kontaktdaten (optional)

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `strassenname` | Straße | `Hauptstraße` |
| `hausnummer` | Hausnummer | `12` |
| `plz` | Postleitzahl | `48157` |
| `wohnort` | Wohnort | `Münster` |
| `telefon` | Telefonnummer | `01234 567890` |
| `telefonMobil` | Mobilnummer | `0176 12345678` |
| `emailPrivat` | Private E-Mail | `s.ammon@privat.de` |
| `emailDienstlich` | Dienstliche E-Mail | `s.ammon@schule.de` |

### Sonstige Felder (optional)

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `istSichtbar` | Im SVWS-Client anzeigen? (`true`/`false`) | `true` |
| `istRelevantFuerStatistik` | Für Statistik relevant? (`true`/`false`) | `true` |

## Beispieldatei

Unter `examples/lehrkraefte.csv` finden Sie eine vollständige Lehrerliste. Ein Auszug:

```csv
"kuerzel";"personalTyp";"anrede";"nachname";"vorname";"geschlecht";"geburtsdatum";"istSichtbar"
"AMMO";"LEHRKRAFT";"Frau";"Ammon";"Sabine";"4";"1991-06-18";"true"
"ARAU";"LEHRKRAFT";"Herr";"Araujo-Cintra";"Markus";"3";"1972-05-02";"true"
```

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| Pflichtfeld `kuerzel` fehlt | Spalte nicht gemappt | Mapping prüfen |
| Kürzel bereits vergeben | Lehrkraft mit diesem Kürzel existiert bereits | Duplikat aus CSV entfernen |
| Ungültiger Geschlechtswert | Wert ist nicht `3` oder `4` | Korrekten Schlüssel verwenden |
| Datumsformat falsch | Geburtsdatum nicht im Format JJJJ-MM-TT | Format anpassen (z. B. `1985-03-21`) |

## Nach dem Import

- Gesamtzahl der Lehrkräfte im SVWS-Server mit der Quelldatei abgleichen
- Stichprobenartig einzelne Kürzel prüfen, da diese in allen weiteren Importen verwendet werden


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="schuelerdaten-anlegen.html">« Schülerdaten anlegen</a>
  <a href="../index.html">Inhaltsverzeichnis</a>
  <a href="import-assistent.html">Import-Assistent nutzen »</a>
</nav>
