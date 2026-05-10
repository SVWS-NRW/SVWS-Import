export interface KlasseApiPayload {
  kuerzel: string
  beschreibung: string | null
  idSchuljahresabschnitt: number
  idJahrgang: number | null
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
  idJahrgang: number | null
  folgeklasse: string
  klassenlehrer: string
  idKlassenlehrer: number | null
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
    beschreibung: row.beschreibung || null,
    idSchuljahresabschnitt,
    idJahrgang: row.idJahrgang,
  }
}
