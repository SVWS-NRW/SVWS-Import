# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Klassenunterricht importieren

## Ziel

Der Tab **Klassenunterricht** weist allen Schülern einer Klasse in einem Zug bestimmte Unterrichtsfächer zu. Statt jeden Schüler einzeln anzulegen, reicht eine Zeile pro Klasse und Fach – die Anwendung trägt den Unterricht automatisch für alle aktiven Schüler dieser Klasse ein.

**Typisches Anwendungsbeispiel:** Sie möchten allen Schülern der Klasse 5a die Fächer Deutsch, Mathematik und Englisch zuweisen. Dafür legen Sie drei Zeilen in Ihrer CSV an – eine pro Fach.

---

## Voraussetzungen

- Klassen für den Abschnitt sind im SVWS-Server angelegt
- Lehrkräfte mit ihrem Kürzel sind vorhanden
- Fächer mit ihrem Kürzel sind vorhanden
- Der Schuljahresabschnitt ist ausgewählt

---

## Schritte

### 1. Schuljahresabschnitt wählen

Wählen Sie oben in der Unterricht-Ansicht den passenden Abschnitt aus der Dropdown-Liste, bevor Sie eine Datei laden.

### 2. Datei laden

Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV-Datei aus. Die Datei wird sofort eingelesen und alle Einträge werden automatisch gegen die Datenbank geprüft.

Während der Prüfung erscheint der Hinweis **„Prüfe Referenzen…"**. Warten Sie, bis dieser verschwindet.

### 3. Tabelle prüfen

Nach dem Laden sehen Sie eine Tabelle mit allen Zeilen Ihrer Datei:

- **Grüne Zeilen (●)** – vollständig aufgelöst, bereit zum Import
- **Rote Zeilen (✖)** – mindestens eine Referenz konnte nicht gefunden werden; Tooltip zeigt Details
- **Orange markierte Felder (⚠)** – Warnung, z. B. Schuljahr in der CSV weicht vom gewählten Abschnitt ab

> **Tipp:** Klicken Sie auf ein orange oder rot markiertes Feld, um den genauen Fehlertext zu lesen.

Eine Warnung-Zusammenfassung über der Tabelle zeigt, wie viele Zeilen nicht aufgelöste Referenzen haben.

### 4. Auswahl einschränken (optional)

Sie können einzelne Zeilen in der Tabelle markieren (Checkbox links). Wenn Zeilen markiert sind, werden **nur diese** beim Import verarbeitet. So lassen sich fehlerhafte Zeilen überspringen.

### 5. Import starten

Klicken Sie auf **„Importieren"**. Die Fortschrittsanzeige zeigt `X / Y Einträge…`, weil intern für jeden Schüler der betreffenden Klasse ein eigener Datensatz erzeugt wird.

> **Hinweis:** Die Gesamtzahl ist höher als die Zeilenanzahl in der CSV – eine CSV-Zeile erzeugt einen Eintrag **pro Schüler** in der Klasse.

### 6. Ergebnis prüfen

Nach dem Import erscheint: `X importiert · Y Fehler`

Zeilen mit einem grünen Häkchen (✔) wurden erfolgreich übertragen. Bei Fehlern können Sie den Import nach Korrektur der Quelldatei erneut durchführen.

### 7. Tabelle leeren

Über **„Leeren"** (roter Papierkorb-Button) entfernen Sie alle Daten aus der Tabelle, um eine neue Datei laden zu können.

---

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `schuljahr` | Schuljahr als vierstellige Jahreszahl | `2025` |
| `abschnitt` | Halbjahr (1 oder 2) | `2` |
| `klasse` | Kürzel der Klasse (exakt wie im SVWS-Server) | `5a` |
| `fach` | Kürzel des Fachs (exakt wie im SVWS-Server) | `D` |

### Optionale Felder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `lehrerkuerzel` | Kürzel der unterrichtenden Lehrkraft | `BIES` |
| `kursart` | Kursart-Kürzel gemäß Schulform-Katalog | `PUK` |
| `wochenstunden` | Wochenstundenzahl als ganze Zahl | `4` |
| `aufszeugnis` | Fach erscheint auf dem Zeugnis (`true`/`false`) | `true` |

> **Spaltenalternativen:** Statt `lehrerkuerzel` werden auch `lehrer` und `fachlehrer` erkannt.

### Trennzeichen

Semikolon (`;`), Komma (`,`) oder Pipe (`|`) – wird automatisch erkannt.

---

## Beispieldatei

Unter `examples/unterricht-klassen.csv` finden Sie eine vollständige Musterdatei. Ein Auszug:

```csv
"schuljahr";"abschnitt";"klasse";"lehrerKuerzel";"kursart";"fach";"wochenstunden";"aufszeugnis"
"2025";"2";"5a";"BIES";"PUK";"D";"4";"true"
"2025";"2";"5a";"BIES";"PUK";"M";"4";"true"
"2025";"2";"5a";"BIES";"PUK";"E";"4";"true"
"2025";"2";"5b";"BILL";"PUK";"D";"4";"true"
```

Jede Zeile steht für ein Fach in einer Klasse. Beim Import wird dieses Fach allen aktiven Schülern der jeweiligen Klasse zugewiesen.

---

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| `Klasse „5a" nicht im gewählten Abschnitt gefunden` | Die Klasse existiert nicht im ausgewählten Schuljahresabschnitt | Klassen zuerst anlegen oder richtigen Abschnitt wählen |
| `Fach „D" nicht gefunden` | Das Fachkürzel ist unbekannt | Fächerliste im SVWS-Server prüfen, Kürzel anpassen |
| `Lehrer „BIES" nicht gefunden` | Das Lehrerkürzel ist unbekannt | Lehrkräfte zuerst importieren oder Kürzel prüfen |
| `Kursart „PUK" für Schulform … nicht zulässig` | Die Kursart ist für diese Schulform nicht vorgesehen | Gültigen Kursart-Code verwenden (z. B. aus dem SVWS-Katalog) |
| `CSV-Abschnitt 2025/2 weicht vom gewählten Abschnitt ab` | Schuljahr/Halbjahr in der Datei stimmt nicht mit dem ausgewählten Abschnitt überein | Abschnitt oben korrekt wählen oder CSV-Datei anpassen |

---

## Wie funktioniert der Import intern?

Die Anwendung ermittelt zunächst alle **aktiven Schüler** der jeweiligen Klasse im gewählten Abschnitt. Für jeden dieser Schüler wird dann ein Leistungsdatensatz mit dem angegebenen Fach, der Lehrkraft und der Kursart angelegt. Dadurch kann eine einzelne CSV-Zeile viele Datenbankeinträge erzeugen.

---

---

| « [Unterricht – Übersicht](unterricht-importieren.md) | [Inhaltsverzeichnis](../index.md) | [Kursunterricht importieren](unterricht-kursunterricht.md) » |
|:---|:---:|---:|
