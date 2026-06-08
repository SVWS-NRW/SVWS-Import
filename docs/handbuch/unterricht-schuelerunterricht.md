# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Schülerunterricht importieren

## Ziel

Der Tab **Schülerunterricht** importiert individuelle Leistungsdaten für einzelne Schüler. Jede Zeile steht für einen Schüler und ein Fach. Neben der reinen Fachzuweisung können gleichzeitig Note, Fehlstunden, Mahnung, Abiturfach-Nummer und weitere Angaben übertragen werden.

**Typisches Anwendungsbeispiel:** Sie erhalten aus einem Vorsystem eine Exportdatei mit Noten und möchten diese direkt in SVWS übernehmen.

---

## Voraussetzungen

- Schüler müssen bereits mit Status **aktiv** im SVWS-Server vorhanden sein
- Fächer und Lehrkräfte sind bekannt (Kürzel vorhanden)
- Falls Kurse verknüpft werden sollen: Kurse müssen bereits angelegt sein (z. B. über Tab [Kursunterricht](unterricht-kursunterricht.md))
- Schüler werden eindeutig identifiziert über **Nachname + Vorname + Geburtsdatum** (Geburtsdatum ist optional, erhöht aber die Treffsicherheit)

---

## Schritte

### 1. Datei laden

Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV-Datei. Die Anwendung lädt automatisch alle nötigen Referenzdaten aus der Datenbank:

- Schülerliste des Abschnitts
- Fächer-Katalog
- Lehrkräfte-Liste
- Kurs-Liste des Abschnitts

### 2. Tabelle prüfen

Jede Zeile wird auf folgende Probleme geprüft:

- Schüler nicht gefunden (Nachname, Vorname, evtl. Geburtsdatum stimmt nicht überein)
- Fach nicht gefunden
- Lehrer nicht gefunden
- Zusatzkraft nicht gefunden
- Kurs in diesem Abschnitt nicht gefunden
- Schuljahresabschnitt nicht vorhanden

Fehlerhafte Zeilen erscheinen rot und werden beim Import übersprungen.

### 3. Import starten

Klicken Sie auf **„Importieren"**. Für jede gültige Zeile läuft folgendes ab:

1. Der Lernabschnitt des Schülers wird ermittelt
2. Es wird geprüft, ob bereits ein Leistungsdatensatz für dieses Fach existiert (Duplikaterkennung)
3. Falls nicht vorhanden: Neuer Leistungsdatensatz wird angelegt
4. Alle weiteren Felder (Note, Fehlstunden, Kurs, usw.) werden in einem zweiten Schritt eingetragen
5. Falls dieser zweite Schritt scheitert, wird der erste Schritt automatisch **rückgängig gemacht** (Rollback)

### 4. Duplikate

Wenn für einen Schüler im selben Abschnitt bereits Leistungsdaten für ein bestimmtes Fach vorliegen, wird die Zeile als **„bereits erledigt"** markiert (grünes ✔) und nicht erneut importiert. Es wird kein Fehler angezeigt.

---

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `nachname` | Nachname des Schülers | `Schneider` |
| `vorname` | Vorname des Schülers | `Uwe` |
| `geburtsdatum` | Geburtsdatum (Format TT.MM.JJJJ) | `05.07.2006` |
| `schuljahr` | Schuljahr als vierstellige Jahreszahl | `2025` |
| `abschnitt` | Halbjahr (1 oder 2) | `2` |
| `fach` | Kürzel des Unterrichtsfachs | `M` |

> **Hinweis:** Das Geburtsdatum ist technisch optional – ohne Geburtsdatum wird der erste Schüler mit passendem Namen verwendet. Bei Namensgleichheit **muss** das Geburtsdatum angegeben werden.

### Felder für den Unterricht

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `fachlehrer` | Kürzel der Fachlehrkraft | `BIES` |
| `kurs` | Kürzel des Kurses (muss im Abschnitt existieren) | `AG-Sport` |
| `kursart` | Kursart-Kürzel | `PUK` |
| `jahrgaenge` | Jahrgangskürzel (kommagetrennt) | `05,06,07` |
| `wochenstd` | Wochenstunden | `4` |

### Felder für Bewertung und Notenvergabe

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `note` | Zeugnisnote (1–6 oder Notentext) | `2` |
| `abiturfach` | Abiturfachnummer (1–4) | `3` |

### Felder für Fehlzeiten

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `fehlstd` | Gesamte Fehlstunden im Fach | `3` |
| `unentschfehlstd` | Davon unentschuldigte Fehlstunden | `1` |
| `mahnung` | Ist der Schüler gemahnt? (`true`/`false` oder `ja`/`nein`) | `false` |
| `mahndatum` | Datum der Mahnung (TT.MM.JJJJ) | `15.02.2026` |

### Sonstige Felder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|---------|
| `externeschulnr` | Schulnummer bei Kooperationsunterricht an externer Schule | `123456` |
| `zusatzkraft` | Kürzel einer Zusatzlehrkraft (z. B. für Förderunterricht) | `MUEL` |
| `wochenstdzusatzkraft` | Wochenstunden der Zusatzkraft | `2` |

---

## Beispieldatei

Unter `examples/unterricht-schueler.csv` finden Sie eine vollständige Musterdatei. Ein Auszug:

```csv
"nachname";"vorname";"geburtsdatum";"schuljahr";"abschnitt";"fach";"fachlehrer";"kurs";"kursart";"jahrgaenge";"note";"abiturfach";"wochenstd";"externeschulnr";"zusatzkraft";"wochenstdzusatzkraft";"fehlstd";"unentschfehlstd";"mahnung";"mahndatum"
"Schneider";"Uwe";"05.07.2006";"2025";"2";"M";"BIES";"";"PUK";"";"1";"";"4";"";"";"";"0";"0";"";""
"Güler";"Aslı";"01.07.2013";"2025";"2";"SP";"ASH";"AG-Sport";"PUT";"05,06,07";"1";"";"4";"";"";"";"0";"0";"";""
```

Nicht benötigte Felder können leer bleiben – einfach den Wert weglassen, das Semikolon aber stehen lassen.

---

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| `Schüler „Schneider, Uwe" nicht gefunden` | Name stimmt nicht überein oder Schüler ist nicht aktiv | Namen prüfen; inaktive Schüler werden nicht berücksichtigt |
| `Fach „M" nicht gefunden` | Fachkürzel unbekannt | Fächer-Katalog im SVWS-Server prüfen |
| `Lehrer „BIES" nicht gefunden` | Lehrerkürzel unbekannt | Lehrkräfte prüfen |
| `Kurs „AG-Sport" in diesem Abschnitt nicht gefunden` | Kurs nicht angelegt | Zuerst Kurse über Tab „Kursunterricht" anlegen |
| `Abschnitt 2025/2 nicht gefunden` | Schuljahresabschnitt nicht vorhanden | Korrekte Werte in `schuljahr` und `abschnitt` prüfen |
| `Leistungsdaten für Fach „M" bereits vorhanden` | Datensatz existiert bereits | Kein erneuter Import nötig – Zeile wird übersprungen |

---

## Rollback bei Fehlern

Wenn das Anlegen der Zusatzangaben (Note, Fehlstunden etc.) nach dem Erstellen des Grunddatensatzes fehlschlägt, wird der Grunddatensatz **automatisch wieder gelöscht**. Dadurch entstehen keine halbfertigen Einträge in der Datenbank.

---


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="unterricht-kursunterricht.html">« Kursunterricht importieren</a>
  <a href="../index.html">Inhaltsverzeichnis</a>
  <a href="unterricht-kurszuweisung.html">Kurszuweisung »</a>
</nav>
