export interface JahrgangApiPayload {
  kuerzel: string
  kuerzelStatistik: string | null
  gliederung: string | null
}

export interface JahrgangDetails {
  id: number
  kuerzel: string
  kuerzelStatistik: string | null
  bezeichnung: string | null
  gliederung: string | null
  [key: string]: unknown
}

export interface JahrgangImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  kuerzel: string
  kuerzelStatistik: string
  gliederung: string
}

export function jahrgangImportToApi(row: JahrgangImportRow): JahrgangApiPayload {
  return {
    kuerzel: row.kuerzel,
    kuerzelStatistik: row.kuerzelStatistik || null,
    gliederung: row.gliederung || null,
  }
}
