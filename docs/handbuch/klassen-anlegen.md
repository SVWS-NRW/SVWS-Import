# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Klassen anlegen


## Ziel

Klassenstammdaten für einen Schuljahresabschnitt über eine CSV- oder XLSX-Datei in SVWS anlegen. Klassen müssen vor dem [Klassenunterricht-Import](unterricht-klassenunterricht.md) vorhanden sein.

## Voraussetzungen

- Jahrgänge sind bereits in SVWS angelegt (Kürzel werden referenziert)
- Lehrkräfte sind bereits angelegt (Kürzel des Klassenlehrers wird referenziert)
- Der Schuljahresabschnitt ist vorhanden

## Schritte

1. Öffnen Sie die Kachel **Klassen** im Import-Bereich.
2. Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV- oder XLSX-Datei.
3. Prüfen Sie die Vorschautabelle auf korrekte Spaltenerkennung.
4. Führen Sie das Spalten-Mapping durch.
5. Korrigieren Sie rot markierte Pflichtfelder.
6. Klicken Sie auf **„Importieren"** und prüfen Sie das Ergebnis.

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `schuljahr` | Schuljahr als vierstellige Jahreszahl | `2025` |
| `abschnitt` | Halbjahr (1 oder 2) | `2` |
| `kuerzel` | Eindeutiges Klassenkürzel | `5a` |
| `jahrgang` | Zugehöriges Jahrgangs-Kürzel (muss in SVWS existieren) | `05` |

### Wichtige optionale Felder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `beschreibung` | Langbezeichnung der Klasse | `Klasse 5a` |
| `parallelitaet` | Buchstabe für parallele Klassen | `A` |
| `klassenlehrer` | Kürzel der Klassenlehrkraft | `BIES` |
| `folgeklasse` | Kürzel der Klasse im nächsten Halbjahr | `6a` |
| `vorgaengerklasse` | Kürzel der Klasse im vorigen Halbjahr | _(leer)_ |
| `sortierung` | Anzeigereihenfolge | `10` |
| `teilstandort` | Kürzel des Schulstandorts | `A` |
| `pruefungsordnung` | Bezeichnung der Prüfungsordnung | `APO-SI 05: Jahrgänge 5-10` |
| `noteneingabeGesperrt` | Noteneingabe gesperrt? (`true`/`false`) | `false` |
| `beginnSommersemester` | Beginn im Sommersemester? (`true`/`false`) | `false` |

## Beispieldatei

Unter `examples/klassen.csv` finden Sie eine vollständige Klassenliste. Ein Auszug:

```csv
"schuljahr";"abschnitt";"kuerzel";"beschreibung";"jahrgang";"parallelitaet";"folgeklasse";"sortierung";"klassenlehrer"
"2025";"2";"5a";"5a";"05";"A";"6a";"10";"BIES"
"2025";"2";"10a";"10a";"10";"A";"EF";"60";"FRIT"
```

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| Jahrgang nicht gefunden | Jahrgangs-Kürzel in der CSV stimmt nicht mit SVWS überein | Jahrgänge zuerst importieren, Kürzel prüfen |
| Lehrkraft nicht gefunden | Lehrerkürzel unbekannt | Lehrerdaten zuerst importieren |
| Klasse bereits vorhanden | Klasse für diesen Abschnitt existiert bereits | Duplikat aus CSV entfernen oder Eintrag in SVWS löschen |
| Abschnitt nicht gefunden | Schuljahr/Halbjahr-Kombination existiert nicht | Schuljahresabschnitt zuerst anlegen |

## Qualitätscheck nach dem Import

- Alle Klassen in der gewünschten Anzahl vorhanden
- Klassenlehrkräfte korrekt zugeordnet
- Folgeklassen sind plausibel (z. B. Klasse 5a → 6a)


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="import-assistent.html">« Import-Assistent nutzen</a>
  <a href="../index.html">Inhaltsverzeichnis</a>
  <a href="jahrgaenge-anlegen.html">Jahrgänge anlegen »</a>
</nav>
