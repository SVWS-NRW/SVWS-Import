export interface KlasseApiPayload {
  kuerzel: string
  kuerzelStatistik: string | null
  beschreibung: string | null
  idSchuljahresabschnitt: number
}

export interface KlasseDetails {
  id: number
  kuerzel: string
  kuerzelStatistik: string | null
  beschreibung: string | null
  [key: string]: unknown
}

export interface KlasseImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  kuerzel: string
  kuerzelStatistik: string
  beschreibung: string
  jahrgang: string
  folgeklasse: string
  klassenlehrer: string
  orgForm: string
  klassenart: string
  gliederung: string
  fachklasse: string
  jahr: string
  abschnitt: string
}

export function klasseImportToApi(row: KlasseImportRow, idSchuljahresabschnitt: number): KlasseApiPayload {
  return {
    kuerzel: row.kuerzel,
    kuerzelStatistik: row.kuerzelStatistik || null,
    beschreibung: row.beschreibung || null,
    idSchuljahresabschnitt,
  }
}
