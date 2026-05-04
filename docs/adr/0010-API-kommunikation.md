# ADR 0010: Kapselung der API-Kommunikation

## Status

Accepted

## Kontext

Die Kommunikation mit dem SVWS-Server erfolgt über REST und soll wartbar und testbar bleiben.

## Entscheidung

* Einführung eines Service-Layers
* Alle API-Aufrufe werden in dedizierten Services gekapselt

## Begründung

* Trennung von UI und API-Logik
* Wiederverwendbarkeit
* Einfachere Tests

## Struktur

* /services/apiClient.ts
* /services/svwsService.ts

## Alternativen

* API-Aufrufe direkt in Komponenten → schwer wartbar

## Konsequenzen

* Zusätzliche Abstraktionsschicht
* Klare Schnittstellendefinition notwendig
