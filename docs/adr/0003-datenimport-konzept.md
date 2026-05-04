# ADR 0003: Verarbeitung von Importdaten im Browser

## Status

Accepted

## Kontext

Die Anwendung soll Schüler- und Lehrerdaten importieren, bearbeiten und validieren können.

## Entscheidung

Die Datenverarbeitung erfolgt vollständig im Browser:

* Import (z. B. CSV/Excel)
* Transformation in internes Datenmodell
* Bearbeitung in tabellarischer Form

## Begründung

* Keine sensiblen Daten verlassen den Client unnötig
* Offline-Vorbereitung möglich
* Schnellere Interaktion ohne Serverlatenz

## Alternativen

* Serverseitige Verarbeitung → nicht gewünscht
* Direkte API-Eingabe ohne Bearbeitung → zu unflexibel

## Konsequenzen

* Speicherverbrauch im Browser beachten
* Validierungslogik muss clientseitig implementiert werden
* Komplexität im Frontend steigt
