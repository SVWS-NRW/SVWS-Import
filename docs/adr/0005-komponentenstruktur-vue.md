# ADR 0005: Strukturierung der Vue-Komponenten

## Status

Accepted

## Kontext

Die Anwendung soll langfristig wartbar bleiben und getrennte Bearbeitung ermöglichen.

## Entscheidung

* Verwendung von Single File Components (.vue)
* Trennung nach Verantwortlichkeiten:

  * UI-Komponenten
  * Datenlogik (Composables / Services)
  * API-Zugriffe

## Begründung

* Klare Trennung erleichtert Wartung
* Mehrere Entwickler können parallel arbeiten
* Wiederverwendbarkeit von Komponenten

## Strukturvorschlag

* /components
* /views
* /services
* /models
* /composables

## Alternativen

* Monolithische Komponenten → schwer wartbar
* Logik direkt in UI → unübersichtlich

## Konsequenzen

* Mehr initialer Strukturaufwand
* Klare Namenskonventionen erforderlich
