# ADR 0004: Integration mit SVWS-Server über REST API

## Status

Accepted

## Kontext

Die Anwendung soll Daten an den SVWS-Server übertragen.

Referenz:
https://github.com/SVWS-NRW/SVWS-Server

## Entscheidung

* Kommunikation erfolgt über REST API
* Authentifizierung via Basic Auth
* Direkte Kommunikation vom Browser zum Server

## Begründung

* SVWS stellt REST-Schnittstelle bereit
* Keine zusätzliche Middleware erforderlich
* Einfacher Implementierungsaufwand

## Alternativen

* Proxy-Backend → erhöht Komplexität
* Batch-Export → weniger flexibel

## Konsequenzen

* Sicherheitsaspekte (Credentials im Browser!)
* CORS-Konfiguration erforderlich
* Fehlerhandling bei Netzwerkproblemen notwendig
