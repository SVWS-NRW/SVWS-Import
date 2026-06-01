# ADR 0001: Verwendung von Vue.js mit TypeScript für SPA

## Status

Accepted

## Kontext

Die Anwendung soll vollständig im Browser laufen (Single Page Application) und ohne Backend ausgeliefert werden.
Ziel ist eine wartbare, erweiterbare und klar strukturierte Codebasis.

## Entscheidung

Die Anwendung wird als SPA mit Vue.js und TypeScript umgesetzt.

## Begründung

* Vue bietet eine klare Komponentenstruktur
* TypeScript erhöht Typsicherheit und Wartbarkeit
* Gute Tooling-Unterstützung (Vite, npm)
* Geringe Einstiegshürde für Entwickler

## Alternativen

* React → mehr Boilerplate, keine klare Trennung ohne zusätzliche Konventionen
* Angular → zu schwergewichtig für den Anwendungsfall
* Vanilla JS → nicht wartbar bei wachsender Komplexität

## Konsequenzen

* Build-Prozess notwendig
* Entwickler müssen TypeScript beherrschen
* Strukturierung in Komponenten erforderlich
