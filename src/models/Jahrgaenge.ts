/** Request-Body für POST /jahrgaenge/create (JahrgangCreateRequest) */
export interface JahrgangCreateRequest {
  kuerzel: string
  bezeichnung: string
  kurzbezeichnung: string | null
  idJahrgang: number
  sortierung: number | null
  idSchulgliederung: number | null
  idFolgejahrgang: number | null
  idBildungsstufe: number | null
  anzahlRestabschnitte: number | null
  istSichtbar: boolean
  gueltigVon: number | null
  gueltigBis: number | null
}

/** Antwort von GET /jahrgaenge (JahrgangsDaten) */
export interface JahrgangDetails {
  id: number
  kuerzel: string
  kurzbezeichnung?: string | null
  bezeichnung: string | null
  idJahrgang?: number | null
  sortierung?: number | null
  idSchulgliederung?: number | null
  istSichtbar?: boolean
  /** Nicht Teil von JahrgangsDaten: wird von fetchJahrgaenge über idJahrgang aus dem ASD-Katalog ergänzt */
  kuerzelStatistik?: string | null
  [key: string]: unknown
}

export interface JahrgangImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  kuerzel: string
  kurzbezeichnung: string
  /** Kürzel des ASD-Jahrgangs (Statistik), wird über den Katalog in idJahrgang aufgelöst */
  kuerzelStatistik: string
  bezeichnung: string
  sortierung: string
  /** Kürzel der Schulgliederung, wird über den Katalog in idSchulgliederung aufgelöst */
  kuerzelSchulgliederung: string
  istSichtbar: string
  anzahlRestabschnitte: string
  idBildungsstufe: string
  idFolgejahrgang: string
  gueltigVon: string
  gueltigBis: string
}

/** Katalog-Lookups aus allinone.json: Kürzel → CoreType-ID */
export interface JahrgangAsdKataloge {
  jahrgaenge: Map<string, number>
  schulgliederungen: Map<string, number>
}

function parseIntOrNull(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  const n = Number(s)
  return Number.isInteger(n) ? n : null
}

function parseBool(raw: string, defaultVal: boolean): boolean {
  const s = raw.trim().toLowerCase()
  if (!s) return defaultVal
  return s === 'true' || s === '1' || s === 'ja' || s === 'x'
}

/** Liefert die Validierungsfehler einer Zeile; ohne Kataloge werden die Kürzel nicht aufgelöst. */
export function validateJahrgangRow(row: JahrgangImportRow, kataloge?: JahrgangAsdKataloge): string[] {
  const errors: string[] = []
  if (!row.kuerzel.trim()) errors.push('Kürzel fehlt')
  if (!row.bezeichnung.trim()) errors.push('Bezeichnung fehlt')
  if (row.kuerzel.trim().length > 20) errors.push('Kürzel länger als 20 Zeichen')
  if (row.bezeichnung.trim().length > 100) errors.push('Bezeichnung länger als 100 Zeichen')
  if (row.kurzbezeichnung.trim().length > 2) errors.push('Kurzbezeichnung länger als 2 Zeichen')
  const rest = parseIntOrNull(row.anzahlRestabschnitte)
  if (rest !== null && (rest < 0 || rest > 41)) errors.push('Restabschnitte muss zwischen 0 und 41 liegen')
  const asd = row.kuerzelStatistik.trim()
  if (!asd) errors.push('Statistik-Kürzel fehlt')
  else if (kataloge && !kataloge.jahrgaenge.has(asd)) errors.push(`Statistik-Kürzel "${asd}" ist kein gültiger ASD-Jahrgang`)
  const gl = row.kuerzelSchulgliederung.trim()
  if (gl && kataloge && !kataloge.schulgliederungen.has(gl)) errors.push(`Schulgliederung "${gl}" unbekannt`)
  for (const [field, label] of [
    ['sortierung', 'Sortierung'], ['anzahlRestabschnitte', 'Restabschnitte'], ['idBildungsstufe', 'Bildungsstufe'],
    ['idFolgejahrgang', 'Folgejahrgang'], ['gueltigVon', 'Gültig von'], ['gueltigBis', 'Gültig bis'],
  ] as const) {
    if (row[field].trim() && parseIntOrNull(row[field]) === null) errors.push(`${label} ist keine Zahl`)
  }
  return errors
}

export function jahrgangImportToApi(row: JahrgangImportRow, kataloge: JahrgangAsdKataloge): JahrgangCreateRequest {
  const idJahrgang = kataloge.jahrgaenge.get(row.kuerzelStatistik.trim())
  if (idJahrgang === undefined) throw new Error(`Statistik-Kürzel "${row.kuerzelStatistik}" ist kein gültiger ASD-Jahrgang`)
  const gl = row.kuerzelSchulgliederung.trim()
  return {
    kuerzel: row.kuerzel.trim(),
    bezeichnung: row.bezeichnung.trim(),
    kurzbezeichnung: row.kurzbezeichnung.trim() || null,
    idJahrgang,
    sortierung: parseIntOrNull(row.sortierung),
    idSchulgliederung: gl ? kataloge.schulgliederungen.get(gl) ?? null : null,
    idFolgejahrgang: parseIntOrNull(row.idFolgejahrgang),
    idBildungsstufe: parseIntOrNull(row.idBildungsstufe),
    anzahlRestabschnitte: parseIntOrNull(row.anzahlRestabschnitte),
    istSichtbar: parseBool(row.istSichtbar, true),
    gueltigVon: parseIntOrNull(row.gueltigVon),
    gueltigBis: parseIntOrNull(row.gueltigBis),
  }
}
