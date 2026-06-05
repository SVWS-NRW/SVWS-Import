export interface OrtsteilApiPayload {
  ortsteil: string | null
  ort_id: number | null
}

export interface OrtsteilDetails {
  id: number
  ortsteil: string | null
  ort_id: number | null
  bezeichnungOrt: string | null
  plzOrt: string | null
  sortierung: number
  istSichtbar: boolean
  istAenderbar: boolean
  [key: string]: unknown
}

export interface OrtsteilImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  ortsteil: string
  plz: string
  ort: string
  [key: string]: unknown
}

export function ortsteilImportToApi(
  row: OrtsteilImportRow,
  ortId: number | null,
): OrtsteilApiPayload {
  return {
    ortsteil: row.ortsteil.trim() || null,
    ort_id: ortId,
  }
}
