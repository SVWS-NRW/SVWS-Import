# Memory Index

## Projekt-Überblick
**SVWS-Import** — Vue 3 SPA (kein Backend) zum Import von Schuldaten (CSV/XLSX) in den SVWS-Server NRW via REST/Basic Auth. Läuft vollständig im Browser; auch als Electron-Desktop-App verteilbar.

**Zwei parallele, gleichwertige Importpfade:**
- **Wizard** (`/#/wizard`) — modularer 5-Schritte-Flow, Einsteigerfreundlich, geführter Workflow für unbekannte Dateistrukturen
- **Import** (`/#/import`) — entitätsspezifische Views/Stores, direkter Zugriff, deckt Aufgaben ab die der Wizard nicht abbildet

Beide Pfade werden aktiv weiterentwickelt. Der Wizard ist kein Ersatz für den Import-Bereich.

---

## Memory-Dateien

- [Projektstruktur & Dateiübersicht](project_structure.md) — Vollständige Dateistruktur, Tech-Stack, API-Endpunkte, beide Importpfade, Erweiterungsanleitung
- [ADR-Entscheidungen](project_adr_decisions.md) — 15 Architekturentscheidungen, Kern-Konsequenzen für Entwicklung, Legacy-Schulden

---

## Schnell-Referenz für Agenten

### Schlüsseldateien (Wizard-Pfad)
| Datei | Zweck |
|-------|-------|
| `src/schemas/index.ts` | Registry aller ImportModule — hier neue Module eintragen |
| `src/models/ImportSchema.ts` | Kern-Typen: `FieldDefinition`, `ImportModule`, `MappedRow` |
| `src/stores/wizardStore.ts` | 5-Schritte-Wizard-State |
| `src/services/svwsService.ts` | SVWS-API-Aufrufe + `ENTITY_ENDPOINTS` |
| `src/services/columnMatcher.ts` | Auto-Mapping (Levenshtein + Alias) |
| `src/utils/rawParser.ts` | Generischer CSV/XLSX-Parser (kein Feldmapping) |
| `examples/openAPI/server.json` | OpenAPI-Beschreibung des SVWS-Servers |

### Neues Import-Modul hinzufügen (3 Schritte)
1. `src/schemas/meinModulSchema.ts` anlegen (implementiert `ImportModule`)
2. In `src/schemas/index.ts` ins `importModules`-Array eintragen
3. Ggf. neuen Endpunkt in `svwsService.ts` → `ENTITY_ENDPOINTS` ergänzen

### Auth
- Basic Auth, nur im Pinia-Store `auth.ts`, **niemals** im LocalStorage
- API-Client: `createApiClient(baseUrl, credentials)` in `services/apiClient.ts`
- Verbindungstest: `GET /db/{schema}/lehrer`

### Verfügbare Schemas (alle implementieren `ImportModule`)
`schuelerStammdaten` · `lehrerStammdaten` · `betriebe` · `faecher` · `jahrgaenge` · `klassen` · `kurse`

### Verbotenes Muster
- Direkte Axios-Calls in Komponenten → immer über `services/`
- Credentials im LocalStorage speichern

---

## Externe Referenzen
- OpenAPI SVWS-Server: `examples/openAPI/server.json` (lokal) oder [SVWS-NRW GitHub](https://github.com/SVWS-NRW/SVWS-Server)
- ADR-Dateien: `docs/adr/0001-*.md` bis `docs/adr/0015-*.md`
