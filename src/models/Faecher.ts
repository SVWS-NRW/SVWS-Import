export interface FachApiPayload {
  kuerzel: string
  kuerzelStatistik: string | null
  bezeichnung: string
}

export interface FachDetails {
  id: number
  kuerzel: string
  kuerzelStatistik: string | null
  beschreibung: string | null
  [key: string]: unknown
}

export interface FachImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  kuerzel: string
  kuerzelStatistik: string
  bezeichnung: string
  [key: string]: unknown
}

export function fachImportToApi(row: FachImportRow): FachApiPayload {
  return {
    kuerzel: row.kuerzel,
    kuerzelStatistik: row.kuerzelStatistik || null,
    bezeichnung: row.bezeichnung.trim(),
  }
}