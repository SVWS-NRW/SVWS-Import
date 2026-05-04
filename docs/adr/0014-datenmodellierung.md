# ADR 0014: Einheitliches Datenmodell für Importdaten

## Status

Accepted

## Kontext

Importdaten können aus verschiedenen Quellen stammen und unterschiedlich strukturiert sein.

## Entscheidung

* Einführung eines internen, einheitlichen Datenmodells
* Mapping von Importdaten auf dieses Modell

## Begründung

* Vereinheitlichung der Verarbeitung
* Entkopplung von Datenquelle und API

## Alternativen

* Direkte Verarbeitung von Rohdaten → fehleranfällig

## Konsequenzen

* Mapping-Logik erforderlich
* Pflege des Datenmodells notwendig
