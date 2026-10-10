export interface OrtsteilApiPayload {
  ortsteil: string
  idOrt: number
  sortierung: number
  istSichtbar: boolean
}

export interface OrtsteilDetails {
  id: number
  ortsteil: string | null
  idOrt: number | null
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
  ortId: number,
): OrtsteilApiPayload {
  return {
    ortsteil: row.ortsteil.trim(),
    idOrt: ortId,
    sortierung: 32000,
    istSichtbar: true,
  }
}
