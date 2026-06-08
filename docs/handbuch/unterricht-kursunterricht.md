# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Kursunterricht importieren

## Ziel

Der Tab **Kursunterricht** legt neue Kurse in der SVWS-Datenbank an. Kurse sind nötig, wenn Schüler aus verschiedenen Klassen oder Jahrgängen gemeinsam unterrichtet werden – typischerweise bei Religions-, Wahlpflicht- oder Differenzierungskursen.

**Wichtig:** Dieser Tab legt nur die Kurs-Stammdaten an (Kürzel, Fach, Lehrkraft, Jahrgänge usw.). Die eigentliche Zuweisung von Schülern zu Kursen erfolgt im Tab [Kurszuweisung](unterricht-kurszuweisung.md) oder im Tab [Schülerunterricht](unterricht-schuelerunterricht.md).

---

## Voraussetzungen

- Fächer mit ihrem Kürzel sind im SVWS-Server vorhanden
- Lehrkräfte mit ihrem Kürzel sind vorhanden
- Jahrgänge sind angelegt
- Die Kurse existieren noch **nicht** in der Datenbank (Duplikate werden erkannt und abgelehnt)

---

## Schritte

### 1. Schuljahresabschnitt wählen

Wählen Sie oben in der Unterricht-Ansicht den passenden Abschnitt. Dieser wird als Fallback verwendet, falls `schuljahr` und `abschnitt` nicht in der CSV stehen.

### 2. Datei laden

Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV-Datei. Die Anwendung prüft sofort:
- ob Fach, Lehrkraft und Jahrgänge in der Datenbank vorhanden sind
- ob ein Kurs mit demselben Kürzel, Fach, Kursart und denselben Jahrgängen **bereits existiert** (Duplikat-Prüfung)
- ob in der CSV selbst ein Kürzel mehrfach im selben Abschnitt vorkommt

### 3. Tabelle prüfen

| Symbol | Bedeutung |
|--------|-----------|
| ● gelb | Bereit – alle Referenzen aufgelöst |
| ✖ rot | Fehler – Fach, Lehrer oder Jahrgang nicht gefunden |
| ⊗ rot | Doppelt – Kurs mit diesen Eigenschaften existiert bereits |

### 4. Kurse anlegen

Klicken Sie auf **„Kurse anlegen"**. Jede gültige Zeile erzeugt einen neuen Kurs in der Datenbank. Die Fortschrittsanzeige zeigt `X / Y Kurse…`.

---

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `schuljahr` | Schuljahr als vierstellige Jahreszahl | `2025` |
| `abschnitt` | Halbjahr (1 oder 2) | `2` |
| `kuerzel` | Eindeutiges Kurskürzel für diesen Abschnitt | `ER-05` |
| `fach` | Kürzel des Unterrichtsfachs | `ER` |
| `kursart` | Kursart-Kürzel gemäß Schulform-Katalog | `PUT` |

### Optionale Felder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `lehrerkuerzel` | Kürzel der Lehrkraft | `BIES` |
| `jahrgaenge` | Zulässige Jahrgänge (kommagetrennt) | `05` oder `05,06,07` |
| `zeugnisbezeichnung` | Langbezeichnung für das Zeugnis | `evangelische Religionslehre` |
| `wochenstunden` | Wochenstunden der Schüler | `4` |
| `wochenstundenlehrkraft` | Wochenstunden der Lehrkraft (abweichend möglich) | `2` |
| `fortschreibungsart` | Automatische Weiterführung in den nächsten Abschnitt | `komplett` |
| `schienen` | Schienennummer(n) für die Stundenplanung | `1` |
| `istepochal` | Epochalunterricht? (`true`/`false`) | `false` |

#### Fortschreibungsart – Wertetabelle

| Wert in der CSV | Bedeutung |
|-----------------|-----------|
| `keine` | Kurs wird nicht fortgeschrieben |
| `jghoch` | Nur Kursdefinition wird fortgeschrieben, Jahrgang wird hochgesetzt |
| `jghalten` | Nur Kursdefinition wird fortgeschrieben, Jahrgang bleibt |
| `komplett` | Kurs wird komplett (inkl. Schülerzuweisungen) fortgeschrieben |

> **Tipp:** Für Kurse, die jedes Halbjahr neu belegt werden (z. B. Religionskurse), empfiehlt sich `komplett`. Für jahrgangsübergreifende AGs kann `jghalten` sinnvoll sein.

> **Mehrere Jahrgänge:** Tragen Sie die Jahrgangskürzel kommagetrennt ohne Leerzeichen ein, z. B. `05,06,07` für einen kursübergreifenden AG-Kurs.

---

## Beispieldatei

Unter `examples/unterricht-kurse.csv` finden Sie eine vollständige Musterdatei. Ein Auszug:

```csv
"schuljahr";"abschnitt";"kuerzel";"lehrerkuerzel";"kursart";"fach";"jahrgaenge";"zeugnisbezeichnung";"wochenstunden";"wochenstundenlehrkraft";"fortschreibungsart";"schienen";"istepochal"
"2025";"2";"ER-05";"BIES";"PUT";"ER";"05";"evangelische Religionslehre";"4";"4";"komplett";"";"false"
"2025";"2";"KR-05";"ASH";"PUT";"KR";"05";"katholische Religionslehre";"4";"4";"komplett";"";"false"
"2025";"2";"AG-Sport";"ARAU";"PUT";"SP";"05,06,07";"Abenteuer AG";"4";"2";"jghalten";"";"false"
```

---

## Duplikat-Erkennung

Die Anwendung erkennt Duplikate auf zwei Ebenen:

1. **In der CSV selbst:** Wenn ein Kürzel in derselben Datei mehrfach für denselben Abschnitt vorkommt, werden alle betroffenen Zeilen als fehlerhaft markiert.
2. **In der Datenbank:** Wenn ein Kurs mit gleichem Kürzel, gleichem Fach, gleicher Kursart und gleichen Jahrgängen bereits im ausgewählten Abschnitt existiert, wird die Zeile mit ⊗ markiert und nicht erneut importiert.

---

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| `Fach „ER" nicht gefunden` | Fachkürzel unbekannt | Fächer zuerst anlegen, Kürzel prüfen |
| `Lehrer „BIES" nicht gefunden` | Lehrerkürzel unbekannt | Lehrkräfte importieren oder Kürzel prüfen |
| `Jahrgang „05" nicht gefunden` | Jahrgang nicht angelegt | Jahrgänge zuerst anlegen |
| `Kurs mit Kürzel … existiert bereits` | Kurs bereits vorhanden (Duplikat) | Zeile aus der CSV entfernen oder Kürzel ändern |
| `Kürzel „ER-05" kommt in der Datei mehrfach vor` | Innerhalb der CSV-Datei doppelt | Kürzel eindeutig machen |

---


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="unterricht-klassenunterricht.md">« Klassenunterricht importieren</a>
  <a href="../index.md">Inhaltsverzeichnis</a>
  <a href="unterricht-schuelerunterricht.md">Schülerunterricht importieren »</a>
</nav>
