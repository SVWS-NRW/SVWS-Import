# ADR 0011: Umgang mit Basic Auth im Browser

## Status

Accepted

## Kontext

Die Anwendung greift direkt aus dem Browser auf den SVWS-Server zu und verwendet Basic Auth.

## Entscheidung

* Credentials werden nur temporär im Speicher gehalten (nicht persistent)
* Übergabe via HTTP Authorization Header

## Begründung

* Minimierung von Sicherheitsrisiken
* Kein Speichern sensibler Daten im LocalStorage

## Alternativen

* Speicherung im LocalStorage → unsicher
* Backend-Proxy → nicht Teil der Architektur

## Konsequenzen

* Nutzer muss Credentials pro Sitzung eingeben
* Sensibler Umgang im Code notwendig
