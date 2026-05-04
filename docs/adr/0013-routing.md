# ADR 0013: Clientseitiges Routing

## Status

Accepted

## Kontext

Die SPA benötigt mehrere Ansichten (Import, Mapping, Vorschau, Upload).

## Entscheidung

Verwendung von Vue Router für clientseitiges Routing.

## Begründung

* Standardlösung im Vue-Ökosystem
* Unterstützt Navigation ohne Reload
* Ermöglicht klare Seitenstruktur

## Alternativen

* Kein Routing → alles in einer View → unübersichtlich

## Konsequenzen

* Routing-Konfiguration notwendig
* Deep-Linking eingeschränkt bei rein statischem Hosting
