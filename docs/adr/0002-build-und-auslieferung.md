# ADR 0002: Build-Prozess und Auslieferung als statische Dateien

## Status

Accepted

## Kontext

Die Anwendung soll ohne Server deploybar sein und lokal (z. B. per Datei oder Webserver) laufen.

## Entscheidung

* Build erfolgt über `npm run build`
* Ergebnis ist ein statisches Bundle:

  * index.html
  * /assets/main.js
  * /assets/*.css

## Begründung

* Einfacher Deployment-Prozess
* Keine Serverabhängigkeit
* Kompatibel mit beliebigen Hosting-Umgebungen

## Alternativen

* Serverseitiges Rendering → unnötig komplex
* Dynamischer Backend-Service → widerspricht Ziel

## Konsequenzen

* Routing muss clientseitig erfolgen
* API-Zugriffe erfolgen direkt aus dem Browser
* CORS muss berücksichtigt werden
