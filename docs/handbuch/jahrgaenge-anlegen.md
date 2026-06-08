# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Jahrgänge anlegen


## Ziel

Jahrgangsstufen der Schule über eine CSV- oder XLSX-Datei in SVWS anlegen. Jahrgangskürzel (z. B. `05`, `EF`, `Q1`) werden bei Klassen und Kursen referenziert – dieser Import sollte deshalb **vor** Klassen und Kursen erfolgen.

## Schritte

1. Öffnen Sie die Kachel **Jahrgänge** im Import-Bereich.
2. Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV- oder XLSX-Datei.
3. Prüfen Sie die Vorschautabelle auf korrekte Spaltenerkennung.
4. Führen Sie das Spalten-Mapping durch.
5. Korrigieren Sie rot markierte Pflichtfelder.
6. Klicken Sie auf **„Importieren"** und prüfen Sie das Ergebnis.

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `kuerzel` | Eindeutiges Jahrgangs-Kürzel | `05` |
| `bezeichnung` | Voller Name des Jahrgangs | `Jahrgang 5` |

### Wichtige optionale Felder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `kurzbezeichnung` | Kurzbezeichnung für Listen | `Jg. 05` |
| `kuerzelStatistik` | Kürzel für amtliche Statistik | `05` |
| `sortierung` | Anzeigereihenfolge | `10` |
| `kuerzelSchulgliederung` | Schulgliederungs-Kürzel | `***` |
| `istSichtbar` | Im SVWS-Client anzeigen? (`true`/`false`) | `true` |
| `anzahlRestabschnitte` | Verbleibende Halbjahre bis Schulabschluss | `12` |
| `gueltigVon` | Erster Gültigkeits-Abschnitt | _(leer = immer)_ |
| `gueltigBis` | Letzter Gültigkeits-Abschnitt | _(leer = immer)_ |

## Typische Jahrgangskürzel

| Kürzel | Bezeichnung | Schulform |
|--------|------------|----------|
| `05`–`10` | Jahrgänge 5 bis 10 | Sekundarstufe I |
| `EF` | Einführungsphase | Gymnasiale Oberstufe |
| `Q1`, `Q2` | Qualifikationsphase 1 und 2 | Gymnasiale Oberstufe |

## Beispieldatei

Unter `examples/jahrgaenge.csv` finden Sie alle Jahrgänge von Klasse 5 bis Q2. Ein Auszug:

```csv
"kuerzel";"kurzbezeichnung";"kuerzelStatistik";"bezeichnung";"sortierung";"istSichtbar";"anzahlRestabschnitte"
"05";"Jg. 05";"05";"Jahrgang 5";"10";"true";"12"
"EF";"EF";"EF";"Einführungsphase";"70";"true";"3"
"Q1";"Q1";"Q1";"Qualifikationsphase 1";"80";"true";"2"
```

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| Pflichtfeld `kuerzel` fehlt | Spalte nicht gemappt | Mapping prüfen |
| Jahrgang nicht gefunden (beim Klassen- oder Kursimport) | Kürzel stimmt nicht überein | Kürzel exakt angleichen – Groß-/Kleinschreibung beachten |
| Doppeltes Kürzel | Jahrgang bereits vorhanden | Eintrag aus CSV entfernen oder in SVWS löschen |

## Hinweis zur Importreihenfolge

Importieren Sie Jahrgänge möglichst vor den Klassen, damit Abhängigkeiten sauber aufgelöst werden können.


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="klassen-anlegen.md">« Klassen anlegen</a>
  <a href="../index.md">Inhaltsverzeichnis</a>
  <a href="faecher-anlegen.md">Fächer anlegen »</a>
</nav>
