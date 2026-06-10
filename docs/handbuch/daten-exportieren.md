# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Daten exportieren

## Ziel

Schüler- oder Lehrerdaten aus dem SVWS-Server als CSV- oder JSON-Datei herunterladen – z. B. für Auswertungen, Weitergabe an andere Systeme oder als Datensicherung einzelner Felder.

---

## Aufbau der Exportseite

Die Exportseite ist in drei Bereiche gegliedert:

1. **Datentyp wählen** – Kacheln oben zur Auswahl des Exportbereichs (z. B. Schülerdaten, Lehrerdaten)
2. **Format & Export** – Auswahl des Dateiformats und Start des Exports
3. **Feldauswahl** – Checkboxen zur Auswahl der gewünschten Spalten, gruppiert nach Themenbereich
4. **Datensatzliste** – Tabelle aller verfügbaren Datensätze mit Filtermöglichkeiten und Auswahl

---

## Schritt-für-Schritt

### 1. Datentyp wählen

Klicken Sie oben auf eine der Kacheln:

- **Schülerdaten** – Stammdaten und Schulbesuchsdaten aller Schülerinnen und Schüler
- **Lehrerdaten** – Stammdaten und Personaldaten aller Lehrkräfte

### 2. Format wählen

Im Bereich **Format** wählen Sie zwischen:

| Format | Beschreibung |
|--------|-------------|
| **CSV** | Kommagetrennte Textdatei, öffenbar in Excel, LibreOffice u. a. |
| **JSON** | Strukturierte Datei für Weiterverarbeitung durch andere Programme |

### 3. Felder auswählen

Die verfügbaren Felder sind in Gruppen und Abschnitte unterteilt (z. B. *Personendaten*, *Adresse & Kontakt*, *Schulbesuchsdaten*). Aktivieren Sie die gewünschten Felder per Checkbox.

Mit den Schaltflächen **„Alle"** und **„Keine"** können Sie alle Felder eines Abschnitts auf einmal auswählen bzw. abwählen.

> **Hinweis:** IDs werden automatisch in lesbare Texte aufgelöst (z. B. wird die Religions-ID durch Kürzel und Bezeichnung ersetzt). Es sind keine Nachschlagearbeiten nötig.

### 4. Datensätze auswählen und filtern

Unterhalb der Feldauswahl befindet sich die **Datensatzliste**.

#### Schülerliste

| Filter | Funktion |
|--------|----------|
| **Suchfeld** (links) | Freitextsuche nach Nachname oder Vorname |
| **Abschnitt** | Schuljahresabschnitt, für den die Schülerliste geladen wird |
| **Jahrgang** | Einschränkung auf bestimmte Jahrgänge |
| **Klasse** | Einschränkung auf bestimmte Klassen |
| **Status** | Aktiv, Beurlaubt, Abgänger usw. |
| **↺-Schaltfläche** | Liste neu vom Server laden |

#### Lehrerliste

| Filter | Funktion |
|--------|----------|
| **Suchfeld** (links) | Freitextsuche nach Nachname oder Vorname |
| **Sichtbarkeit** | Sichtbare oder versteckte Einträge |
| **Personaltyp** | Lehrkraft, Sekretariat, Schulleitung usw. |
| **↺-Schaltfläche** | Liste neu vom Server laden |

Klicken Sie in der Liste auf einzelne Zeilen oder nutzen Sie die **Checkbox in der Kopfzeile**, um alle sichtbaren Datensätze gleichzeitig zu markieren. Die Anzeige oben zeigt jederzeit, wie viele Datensätze gefiltert und wie viele ausgewählt sind.

> Ist keine Zeile ausgewählt, werden alle **gefilterten** Datensätze exportiert. Sind Zeilen ausgewählt, werden nur diese exportiert.

### 5. Export starten

Klicken Sie auf die grüne Schaltfläche **„Exportieren"**. Während des Exports wird ein Fortschrittsbalken angezeigt. Die Datei wird anschließend automatisch heruntergeladen.

---

## Verfügbare Felder – Schülerdaten

### Abschnitt „Stammdaten"

| Gruppe | Beispielfelder |
|--------|---------------|
| Personendaten | Nachname, Vorname, Geburtsdatum, Geschlecht, Geburtsort |
| Schule | Status, Jahrgang, Klasse, Aufnahmedatum |
| Adresse & Kontakt | Straße, PLZ, Wohnort, Telefon, E-Mail |
| Herkunft | Staatsangehörigkeit, Geburtsland, Verkehrssprache |
| Religion | Konfessionskürzel, Konfessionsbezeichnung |
| Sonstiges | Migrationshintergrund, BAföG, Masernimpfnachweis u. a. |

### Abschnitt „Schulbesuchsdaten"

| Gruppe | Beispielfelder |
|--------|---------------|
| Vorherige Schule | Schulnummer, Schulform, Entlassdatum, Entlassjahrgang |
| Entlassung (diese Schule) | Entlassungsdatum, Entlassungsgrund, Abschlussart |
| Aufnehmende Schule | Schulnummer, Wechseldatum, bestätigt |
| Grundschule | Einschulungsjahr, Einschulungsart, Übergangsempfehlung |
| Sekundarstufen | Wechseljahr Sek I / Sek II, erste Schulform Sek I |
| Kindergarten | Dauer Kindergartenbesuch, Kindergartenbezeichnung |
| Sprachförderung | Verpflichtung, Teilnahme Sprachförderkurs |
| Schulhistorie | Alle besuchten Schulen, Merkmale |

---

## Verfügbare Felder – Lehrerdaten

### Abschnitt „Stammdaten"

| Gruppe | Beispielfelder |
|--------|---------------|
| Identifikation | Kürzel, Personaltyp |
| Person | Nachname, Vorname, Anrede, Titel, Amtsbezeichnung, Geschlecht, Geburtsdatum, Staatsangehörigkeit |
| Adresse | Straße, Hausnummer, PLZ, Wohnort |
| Kontakt | Telefon, Telefon (Mobil), E-Mail (privat), E-Mail (dienstlich) |
| Status | Aktiv, Sichtbar, Statistikrelevant |

### Abschnitt „Personaldaten"

| Gruppe | Beispielfelder |
|--------|---------------|
| Identifikation | Ident-Nr. (Teil 1 & 2), Personalaktennummer, LBV-Personalnummer, LBV-Vergütungsschlüssel |
| Zu-/Abgang | Zugangsdatum, Zugangsgrund, Abgangsdatum, Abgangsgrund |

---

## Hinweise

- **Boolsche Felder** (Ja/Nein-Angaben) werden als `Ja` oder `Nein` exportiert, nicht als `true`/`false`.
- **Geschlecht** wird als Text exportiert (`männlich`, `weiblich`, `divers`, `ohne Angabe`).
- **IDs** werden wo möglich in lesbare Texte aufgelöst (Schulnummer, Jahrgangs­kürzel, Katalog­bezeichnungen). Felder, für die kein Katalog existiert, erscheinen als Zahl.
- **Arrays** (z. B. Schulhistorie, Merkmale) werden als kompaktes JSON innerhalb einer Spalte exportiert.
- Der **Dateiname** enthält automatisch das aktuelle Datum (z. B. `schueler_export_2026-06-10.csv`).
