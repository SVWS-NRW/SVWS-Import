# ADR 0009: Fehlerhandling und Logging im Frontend

## Status

Accepted

## Kontext

Fehler können beim Import, bei der Validierung oder bei API-Aufrufen auftreten.

## Entscheidung

* Zentrales Error-Handling-Konzept
* Anzeige von Fehlern im UI
* Logging in der Browser-Konsole

## Begründung

* Transparenz für Nutzer
* Unterstützung bei Debugging
* Einheitliches Verhalten

## Alternativen

* Verteiltes Error Handling → inkonsistent
* Kein Logging → schwer nachvollziehbar

## Konsequenzen

* Implementierung eines Error-Services
* Definition von Fehlerklassen/-typen
