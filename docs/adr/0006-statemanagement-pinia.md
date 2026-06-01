# ADR 0006: State Management mit Pinia

## Status

Accepted

## Kontext

Die Anwendung verarbeitet komplexe Daten (Schüler, Lehrer, Importstatus), die über mehrere Komponenten hinweg konsistent verfügbar sein müssen.

## Entscheidung

Es wird Pinia als State-Management-Lösung verwendet.

## Begründung

* Offizielle Empfehlung für Vue 3
* Einfacher als Vuex (weniger Boilerplate)
* Gute TypeScript-Unterstützung
* Modularer Store-Ansatz

## Alternativen

* Vuex → veraltet, mehr Boilerplate
* Kein State Management → führt zu Props-/Event-Chaos
* Lokaler Component-State → nicht ausreichend für globale Daten

## Konsequenzen

* Einführung eines zentralen Datenmodells
* Strukturierung in mehrere Stores (z. B. Schüler, Lehrer, Import)
