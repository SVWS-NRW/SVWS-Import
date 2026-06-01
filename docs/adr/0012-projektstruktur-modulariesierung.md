# ADR 0012: Projektstruktur und Modularisierung

## Status

Accepted

## Kontext

Die Anwendung soll langfristig wartbar und erweiterbar sein.

## Entscheidung

Die Anwendung wird modular strukturiert:

* /components → UI-Komponenten
* /views → Seiten
* /stores → Pinia Stores
* /services → API & Logik
* /models → Typdefinitionen
* /utils → Hilfsfunktionen

## Begründung

* Klare Verantwortlichkeiten
* Skalierbarkeit
* Unterstützt Teamarbeit

## Alternativen

* Flache Struktur → unübersichtlich

## Konsequenzen

* Initialer Strukturaufwand
* Konventionen müssen eingehalten werden
