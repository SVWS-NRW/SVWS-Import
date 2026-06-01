# ADR 0007: Tabellen-Rendering für Datenbearbeitung

## Status

Accepted

## Kontext

Die Anwendung benötigt eine leistungsfähige tabellarische Darstellung mit Editiermöglichkeiten für große Datenmengen.

## Entscheidung

Verwendung einer spezialisierten Tabellenbibliothek (z. B. AG Grid oder vergleichbar).

## Begründung

* Unterstützung für:

  * Inline-Editing
  * Sortierung & Filter
  * Validierung
* Bessere Performance bei großen Datensätzen
* Reduziert Eigenimplementierung

## Alternativen

* Native HTML-Tabellen → nicht ausreichend
* Eigenbau → hoher Entwicklungsaufwand
* Leichte Grid-Libraries → oft zu eingeschränkt

## Konsequenzen

* Zusätzige Abhängigkeit
* Einarbeitung in API notwendig
* Styling-Anpassungen erforderlich
