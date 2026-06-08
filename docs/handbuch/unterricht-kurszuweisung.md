# <img src="../assets/svws-import-logo.svg" alt="SVWS-Import Logo" width="42" style="vertical-align: middle;" /> Kurszuweisung

## Ziel

Der Tab **Kurszuweisung** ermöglicht es, Schüler interaktiv und ohne CSV-Datei direkt einem Kurs zuzuweisen oder aus einem Kurs zu entfernen. Die Ansicht lädt Kurse und Schüler direkt aus der Datenbank.

**Typisches Anwendungsbeispiel:** Sie haben Religionskurse über Tab „Kursunterricht" angelegt und möchten nun schnell bestimmen, welcher Schüler den evangelischen und welcher den katholischen Kurs besucht.

---

## Voraussetzungen

- Kurse sind im SVWS-Server für den gewählten Abschnitt vorhanden (z. B. über Tab [Kursunterricht](unterricht-kursunterricht.md))
- Schüler sind aktiv im SVWS-Server

---

## Aufbau der Ansicht

Die Kurszuweisung besteht aus zwei Bereichen nebeneinander:

- **Links: Kursliste** – alle Kurse des gewählten Abschnitts
- **Rechts: Schülerliste** – aufgeteilt in „Verfügbare Schüler" (oben) und „Zugewiesen" (unten)

---

## Schritte

### 1. Schuljahresabschnitt wählen

Wählen Sie oben in der Unterricht-Ansicht den passenden Abschnitt.

### 2. Kurse und Schüler laden

Klicken Sie auf die Schaltfläche **„Laden"** in der **Kurse**-Zeile der Filterleiste, um alle Kurse des Abschnitts aus der Datenbank zu holen.

Klicken Sie danach auf **„Laden"** in der **Schüler**-Zeile, um alle aktiven Schüler des Abschnitts zu laden.

> **Hinweis:** Wenn Sie in den Tab wechseln, werden beide Listen automatisch geladen, falls sie noch leer sind.

### 3. Kurs auswählen

Klicken Sie in der linken Kursliste auf einen Kurs. Der ausgewählte Kurs wird blau hinterlegt.

Rechts erscheinen nun:
- **Verfügbare Schüler** – alle Schüler, die diesem Kurs noch **nicht** zugewiesen sind
- **Zugewiesen** – alle Schüler, die diesem Kurs bereits angehören

Neben dem Kursnamen (z. B. „Zugewiesen: ER-05") wird angezeigt, für welche **Jahrgänge** dieser Kurs vorgesehen ist.

### 4. Schüler zuweisen

Klicken Sie auf einen Schüler in der Liste **„Verfügbare Schüler"**. Der Schüler wandert sofort in die Liste **„Zugewiesen"** des aktuell gewählten Kurses. Das `+`-Symbol am Ende der Zeile signalisiert die mögliche Aktion.

### 5. Zuweisung aufheben

Klicken Sie auf einen Schüler in der Liste **„Zugewiesen"**. Das `×`-Symbol am Ende der Zeile zeigt an, dass ein Klick den Schüler entfernt. Der Schüler wechselt zurück in die verfügbare Liste.

### 6. Änderungen speichern

Alle Zuweisungen und Entfernungen werden zunächst nur **lokal** gespeichert. Der Speichern-Button erscheint, sobald Änderungen vorhanden sind:

**„X Zuweisung(en) speichern"**

Klicken Sie diesen Button, um alle ausstehenden Änderungen auf einmal an den SVWS-Server zu übertragen. Der Fortschrittsbalken zeigt den Speicherfortschritt.

> **Wichtig:** Wenn Sie die Seite verlassen, ohne zu speichern, gehen alle Änderungen verloren.

---

## Filter nutzen

Die Filterleiste über der Ansicht hat zwei Zeilen:

### Kurs-Filter

| Filter | Funktion |
|--------|---------|
| **Fach suchen…** | Filtert die Kursliste nach Fachbezeichnung (Freitext) |
| **Kursart** | Zeigt nur Kurse einer bestimmten Kursart |
| **Jahrgänge** | Zeigt nur Kurse, die für bestimmte Jahrgänge vorgesehen sind |

### Schüler-Filter

| Filter | Funktion |
|--------|---------|
| **Name suchen…** | Filtert Schüler nach Nachname oder Vorname (Freitext) |
| **Klasse** | Zeigt nur Schüler einer bestimmten Klasse |
| **Jahrgänge** | Zeigt nur Schüler bestimmter Jahrgänge |
| **inkl. Extern** | Wenn aktiviert, werden auch externe Schüler (Status 8) angezeigt |

> **Tipp:** Wenn Sie einen Klassen-Filter gesetzt haben, aber alle Schüler dieser Klasse einem anderen Jahrgang angehören als der gewählte Kurs, erscheint eine **orange Warnmeldung** mit Erklärung.

---

## Jahrgangs-Plausibilitätsprüfung

Wenn ein Kurs für bestimmte Jahrgänge vorgesehen ist (z. B. nur Jahrgang 05), werden Schüler aus anderen Jahrgängen in der verfügbaren Liste **nicht angezeigt**. Dadurch werden versehentliche Fehlzuweisungen verhindert.

Die zulässigen Jahrgänge eines Kurses werden rechts oben unter dem Kurstitel angezeigt: **„Zulässige Jahrgänge: 05, 06"**

---

## Kurs-Übersicht in der linken Liste

Jeder Kurs in der linken Liste zeigt:

- **Fachkürzel** (groß, z. B. `ER`)
- **Kurskürzel** (klein, z. B. `ER-05`)
- **Lehrkraft-Kürzel** (rechts)
- **Anzahl der zugewiesenen Schüler** (Badge rechts)

---

## Häufige Probleme

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Liste bleibt leer nach „Laden" | Kein Schuljahresabschnitt ausgewählt | Abschnitt oben wählen |
| Schüler erscheint nicht in der verfügbaren Liste | Schüler gehört einem anderen Jahrgang an als der Kurs | Jahrgangsfilter des Kurses prüfen oder Schülerfilter anpassen |
| „Speichern"-Button erscheint nicht | Keine ungespeicherten Änderungen vorhanden | – |
| Schüler nicht sichtbar, obwohl vorhanden | Filter schränkt Anzeige ein | Alle Filter zurücksetzen |
| Externe Schüler fehlen | Checkbox „inkl. Extern" nicht aktiviert | Checkbox aktivieren und „Laden" erneut klicken |

---


<nav style="display:flex;justify-content:space-between;margin-top:2rem;padding-top:1rem;border-top:1px solid var(--vp-c-divider)">
  <a href="unterricht-schuelerunterricht.html">« Schülerunterricht importieren</a>
  <a href="../index.html">Inhaltsverzeichnis</a>
  <a href="beispieldateien.html">Beispieldateien »</a>
</nav>
