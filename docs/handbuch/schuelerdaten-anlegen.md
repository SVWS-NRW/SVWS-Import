# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Schülerdaten anlegen


## Ziel

Schülerstammdaten mit persönlichen Angaben, Adresse und Klassenzuordnung über eine CSV- oder XLSX-Datei in SVWS anlegen. Schüler müssen vor dem [Schülerunterricht-Import](unterricht-schuelerunterricht.md) vorhanden sein, da sie dort über Name und Geburtsdatum identifiziert werden.

## Voraussetzungen

- Klassen für den Abschnitt sind bereits angelegt
- Jahrgänge sind vorhanden

## Schritte

1. Öffnen Sie die Kachel **Schülerdaten** im Import-Bereich.
2. Klicken Sie auf **„Datei laden"** und wählen Sie Ihre CSV- oder XLSX-Datei.
3. Prüfen Sie die Vorschautabelle auf korrekte Spaltenerkennung.
4. Führen Sie das Spalten-Mapping durch: ordnen Sie die Quellspalten den SVWS-Feldern zu.
5. Korrigieren Sie rot markierte Pflichtfelder.
6. Wählen Sie, wie mit bereits vorhandenen Schülern verfahren werden soll (siehe unten).
7. Klicken Sie auf **„Alles senden"** und prüfen Sie das Ergebnis in der Spalte **Importstatus**.

### Vorhandene Schüler

Vor dem Senden legen Sie in der Auswahlliste neben „Datei laden" fest, was mit Schülern geschieht, die bereits in SVWS vorhanden sind:

| Auswahl | Wirkung |
|---------|---------|
| **Vorhandene Schüler überspringen** (Standard) | Vorhandene Schüler bleiben unverändert, nur neue werden angelegt. |
| **Vorhandene Schüler überschreiben** | Vorhandene Schüler werden mit den Werten aus der Datei aktualisiert. **Leere Zellen ändern nichts** – vorhandene Daten bleiben dann erhalten. |
| **Schüler immer neu anlegen** | Jede Zeile wird als neuer Schüler angelegt (frühere Arbeitsweise, kann Duplikate erzeugen). |

Ein Schüler gilt als vorhanden, wenn **Nachname, Vorname und Geburtsdatum** übereinstimmen. Enthält die Datei eine Spalte **`Schüler-ID`** (z. B. aus dem Schülerexport), wird stattdessen über die ID zugeordnet; sind Name oder Geburtsdatum zusätzlich angegeben, müssen sie zum Schüler mit dieser ID passen. Gibt es mehrere Schüler mit gleichem Namen und Geburtsdatum, kann nur über die Schüler-ID überschrieben werden.

> **Hinweis:** Abgeglichen wird mit den Schülern des aktuellen Schuljahresabschnitts.

## Aufbau der CSV-Datei

### Pflichtfelder

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `Nachname` | Nachname | `Yılmaz` |
| `Vorname` | Vorname | `Fatima` |
| `geburtsdatum` | Geburtsdatum (TT.MM.JJJJ) | `15.03.2008` |
| `klasse` | Klassenkürzel (muss in SVWS existieren) | `9b` |

### Persönliche Daten (optional)

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `Alle Vornamen` | Alle Vornamen vollständig | `Fatima Nur` |
| `geburtsname` | Geburtsname falls abweichend | _(leer)_ |
| `geschlecht` | `m` = männlich, `w` = weiblich, `d` = divers | `w` |
| `geburtsort` | Geburtsort | `Istanbul` |
| `staatsangehörigkeit` | Staatsangehörigkeitsschlüssel (3-stellig) | `TUR` |
| `2. staatsang.` | Zweite Staatsangehörigkeit | `POL` |
| `konfession` | Konfessionsbezeichnung | `islamisch` |
| `konfessionskuerzel` | Konfessionskürzel | `IS` |
| `geburtsland` | Geburtsland | `TUR` |
| `verkehrssprache familie` | Familiensprache | `Türkisch` |
| `zuzugsjahr` | Jahr des Zuzugs nach Deutschland | `2015` |

### Adressdaten (optional)

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `straße` | Straßenname | `Rosenstraße` |
| `hausnummer` | Hausnummer | `12a` |
| `postleitzahl` | PLZ | `40210` |
| `wohnort` | Wohnort | `Düsseldorf` |
| `telefon` | Telefonnummer | `0211 445566` |
| `mobil` | Mobilnummer | `0176 12345678` |
| `e-mail` | Private E-Mail | `f.yilmaz@privat.de` |
| `e-mail schule` | Schulische E-Mail | `f.yilmaz@schule.de` |

### Schulbezogene Felder (optional)

| Spaltenname | Beschreibung | Beispiel |
|-------------|-------------|----------|
| `status` | `aktiv`, `abgegangen`, `neuaufnahme` | `aktiv` |
| `jahrgang` | Jahrgangs-Kürzel | `09` |
| `anmeldedatum` | Datum der Anmeldung (TT.MM.JJJJ) | _(leer)_ |
| `aufnahmedatum` | Datum der Aufnahme | `01.08.2023` |
| `externe schulnummer` | Schulnummer der Herkunftsschule | _(leer)_ |
| `masernimpfnachweis` | Nachweis vorhanden? (`ja`/`nein`) | `ja` |
| `keine auskunft an dritte` | Auskunftssperre? (`ja`/`nein`) | `nein` |

## Beispieldatei

Unter `examples/schuelerdaten.csv` finden Sie eine vollständige Schülerliste. Ein Auszug:

```csv
"Nachname";"Vorname";"geschlecht";"geburtsdatum";"klasse";"jahrgang";"status"
"Yılmaz";"Fatima";"w";"15.03.2008";"9b";"09";"aktiv"
"Müller";"Anna";"w";"12.04.2007";"10a";"10";"aktiv"
```

## Häufige Fehler und Lösungen

| Fehlermeldung | Ursache | Lösung |
|---------------|---------|--------|
| Pflichtfeld `Nachname` fehlt | Spalte nicht gemappt oder leer | Mapping prüfen |
| Klasse nicht gefunden | Klassenkürzel stimmt nicht überein | Klassen zuerst importieren, Kürzel angleichen |
| Ungültiger Geschlechtswert | Wert ist nicht `m`, `w` oder `d` | Korrekte Werte verwenden |
| Schüler beim Unterrichtsimport nicht gefunden | Name oder Geburtsdatum weicht ab | Schreibweise exakt angleichen |
| Schüler nicht eindeutig | Mehrere Schüler mit gleichem Namen und Geburtsdatum | Spalte `Schüler-ID` ergänzen |
| Schüler-ID passt nicht zu Name/Geburtsdatum | ID gehört zu einem anderen Schüler | ID oder Name prüfen |

## Erzieherdaten importieren

Im Tab **„Erzieherdaten"** der Schüler-Ansicht werden Erziehungsberechtigte zu bereits vorhandenen Schülern importiert. Die Schüler werden – wie beim Schulbesuch – über **Nachname + Vorname + Geburtsdatum** gesucht (Spalte „Abgleich").

Unterstützte Dateien:

- die CSV-Datei im Format von `examples/schueler-erzieher.csv`
- der Schild-NRW-3-Export **`SchuelerErzieher.dat`** (Pipe-getrennt, Spalten wie `Nachname 1.Person`, `E-Mail 2. Person`)

Eine Zeile entspricht einem Erzieher-Eintrag mit **bis zu zwei Personen** (z. B. Mutter und Vater) und einer gemeinsamen Adresse. Für einen Schüler können mehrere Zeilen vorkommen (z. B. getrennt lebende Eltern).

| Spalte | Beschreibung | Beispiel |
|--------|-------------|----------|
| `nachname`, `vorname`, `geburtsdatum` | Schüler (Pflicht) | `Müller`, `Anna`, `12.04.2007` |
| `erzieherart` | Art des Eintrags | `Eltern`, `Mutter`, `Schüler ist volljährig` |
| `anrede1`, `titel1`, `nachname1`, `vorname1`, `email1` | 1. Person (Name Pflicht) | `Frau`, `Dr.`, `Müller`, `Sabine` |
| `staatsangehoerigkeit1` | Staatsangehörigkeit der 1. Person | `DEU` |
| `anrede2`, `titel2`, `nachname2`, `vorname2`, `email2` | 2. Person (optional) | `Herr`, `Müller`, `Thomas` |
| `staatsangehoerigkeit2` | Staatsangehörigkeit der 2. Person | `TUR` |
| `strasse`, `hausnummer`, `hausnummerzusatz` | Gemeinsame Adresse | `Westfalenstraße`, `15` |
| `plz`, `ort`, `ortsteil` | Wohnort aus dem Ortskatalog | `44137`, `Dortmund` |
| `anschreiben` | Erhält Anschreiben (`J`/`N`) | `J` |
| `bemerkungen` | Freitext | |

Hinweise:

- **Staatsangehörigkeit**: Angegeben werden kann der ISO-3-Code (`DEU`), der DEStatis-Schlüssel (`000`), die Bezeichnung (`deutsch`) oder direkt die Katalog-ID aus `allinone.json`. Gesendet wird immer die Katalog-ID; unbekannte Werte werden rot markiert.
- **Unbekannte Erzieherarten** werden in der Tabelle mit ✚ markiert und beim Senden im Katalog der Schule angelegt.
- **PLZ/Ort**, die nicht im Ortskatalog stehen, werden mit ⚠ markiert; der Eintrag wird dann ohne Wohnort gespeichert.
- **Bereits vorhandene Erzieher**: Ist die 1. Person (gleicher Nach- und Vorname) beim selben Schüler schon eingetragen, entscheidet die Auswahl neben „Datei laden":

| Auswahl | Verhalten | Status |
|---------|-----------|--------|
| **Vorhandene Erzieher überspringen** (Standard) | Die Zeile wird nicht importiert – ein erneuter Import erzeugt keine Dubletten | ⏭ Übersprungen |
| **Vorhandene Erzieher überschreiben** | Der vorhandene Eintrag wird mit den Werten aus der Datei aktualisiert; leere Felder lassen vorhandene Werte unverändert. Die 2. Person wird aktualisiert, wenn sie (gleicher Name) schon existiert, sonst im Eintrag ergänzt. | ✎ Überschrieben |
| **Erzieher zusätzlich anlegen** | Es wird immer ein neuer Erzieher-Eintrag angelegt | ✔ Gesendet |

## Nach dem Import

- Gesamtzahl der aktiven Schüler prüfen
- Stichproben auf korrekte Klassenzuordnung prüfen
- Schüler, die beim Unterrichtsimport nicht gefunden werden, sind oft auf Schreibweichenfehler im Nachnamen zurückzuführen


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="verbindung-herstellen.html">« Verbindung Herstellen</a>
  <a href="../index.html">Inhaltsverzeichnis</a>
  <a href="lehrerdaten-anlegen.html">Lehrerdaten anlegen »</a>
</nav>
