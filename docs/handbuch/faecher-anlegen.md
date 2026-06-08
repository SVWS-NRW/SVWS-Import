# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Fächer anlegen


## Ziel

Den Fächerkatalog der Schule über eine CSV- oder XLSX-Datei in SVWS anlegen. Fächerkürzel werden in allen Unterrichtsimporten referenziert – dieser Import sollte deshalb früh erfolgen.

## Schritte

1. Öffnen Sie die Kachel **Fächer** im Import-Bereich.
2. Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV- oder XLSX-Datei.
3. Prüfen Sie in der Vorschautabelle, ob die Spalten korrekt erkannt wurden.
4. Führen Sie das Spalten-Mapping durch: ordnen Sie die Quellspalten den SVWS-Feldern zu.
5. Korrigieren Sie rot markierte Pflichtfelder.
6. Klicken Sie auf **„Importieren"** und prüfen Sie das Ergebnis.

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `kuerzel` | Eindeutiges Fachkürzel | `D` |
| `bezeichnung` | Voller Fachname | `Deutsch` |

### Wichtige optionale Felder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `kuerzelStatistik` | Kürzel für amtliche Statistik | `D` |
| `bezeichnungZeugnis` | Bezeichnung auf dem Zeugnis | `Deutsch` |
| `bezeichnungUeberweisungszeugnis` | Bezeichnung auf Überweisungszeugnis | `Deutsch` |
| `sortierung` | Anzeigereihenfolge (niedrig = weit oben) | `10` |
| `istSichtbar` | Im SVWS-Client anzeigen? (`true`/`false`) | `true` |
| `aufZeugnis` | Standardmäßig auf Zeugnis drucken? (`true`/`false`) | `true` |
| `istFremdsprache` | Ist das Fach eine Fremdsprache? (`true`/`false`) | `false` |
| `istOberstufenFach` | Für die Oberstufe relevant? (`true`/`false`) | `true` |
| `istPruefungsordnungsRelevant` | Prüfungsordnungsrelevant? (`true`/`false`) | `true` |
| `istNachpruefungErlaubt` | Nachprüfung zulässig? (`true`/`false`) | `true` |
| `istSchriftlichZK` | Schriftlich im Zentralabitur? (`true`/`false`) | `true` |
| `holeAusAltenLernabschnitten` | Noten aus alten Abschnitten übernehmen? (`true`/`false`) | `true` |

## Beispieldatei

Unter `examples/faecher.csv` finden Sie einen vollständigen Fächerkatalog. Ein Auszug:

```csv
"kuerzel";"kuerzelStatistik";"bezeichnung";"bezeichnungZeugnis";"sortierung";"istSichtbar";"aufZeugnis";"istFremdsprache";"istOberstufenFach"
"D";"D";"Deutsch";"Deutsch";"10";"true";"true";"false";"true"
"E";"E";"Englisch";"Englisch";"20";"true";"true";"true";"true"
"M";"M";"Mathematik";"Mathematik";"30";"true";"true";"false";"true"
```

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| Pflichtfeld `kuerzel` fehlt | Spalte nicht gemappt oder leer | Spalten-Mapping prüfen |
| Doppeltes Kürzel | Fach existiert bereits | Kürzel eindeutig machen oder Eintrag in SVWS prüfen |
| `true`/`false`-Feld nicht erkannt | Wert enthält Leerzeichen oder unbekannten Text | Wert exakt als `true` oder `false` schreiben |

## Nachkontrolle

- Fachkürzel sind eindeutig und stimmen mit den Kürzeln überein, die in Unterrichtsdateien verwendet werden
- Fremdsprachen sind als `istFremdsprache: true` markiert
- Oberstufenfächer haben `istOberstufenFach: true`

---

| « [Jahrgänge anlegen](jahrgaenge-anlegen.md) | [Inhaltsverzeichnis](../index.md) | [Schuljahresabschnitte laden](schuljahresabschnitte-laden.md) » |
|:---|:---:|---:|
