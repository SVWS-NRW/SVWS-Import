# ADR 0008: Clientseitige Validierung der Importdaten

## Status

Accepted

## Kontext

Die Daten müssen vor dem Versand an den Server validiert werden, um Fehler und fehlerhafte Datensätze zu vermeiden.

## Entscheidung

* Validierung erfolgt vollständig im Client
* Kombination aus:

  * Schema-basierter Validierung
  * Fachlogik (z. B. Pflichtfelder, Formatregeln)

## Begründung

* Sofortiges Feedback für Nutzer
* Reduziert Fehlversuche beim API-Call
* Bessere Nutzererfahrung

## Alternativen

* Nur Servervalidierung → schlechte UX
* Keine Validierung → hohe Fehlerquote

## Konsequenzen

* Doppelte Validierung möglich (Client + Server)
* Pflege von Validierungsregeln notwendig
