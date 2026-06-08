export interface AnkreuzkompetenzJahrgangszuordnung {
  id: number
  idAnkreuzkompetenz: number
  idJahrgang: number
}

export interface Ankreuzkompetenz {
  id: number
  idFach: number | null
  istASV: boolean
  schulgliederung: string | null
  floskelText: string
  abschnitt: number
  istAktiv: boolean
  istSichtbar: boolean
  fachSortierung: number
  sortierung: number
  referenziertInAnderenTabellen?: boolean
  jahrgaengezuordnung: AnkreuzkompetenzJahrgangszuordnung[]
}

export interface AnkreuzkompetenzImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  text: string
  /** Fach-Kürzel oder direkte ID */
  fach: string
  /** Jahrgangs-Kürzel oder kommagetrennte IDs */
  jahrgang: string
  /** 1=1.HJ, 2=2.HJ, 3=beide – Default 3 */
  abschnitt: string
  /** "true"/"false"/"1"/"0" – ob es ASV ist */
  istASV: string
  /** Sortierung als Zahl-String, Default 32000 */
  sortierung: string
  /** Schulgliederung (optional, z. B. "A02") */
  schulgliederung: string
  [key: string]: unknown
}

export interface AnkreuzkompetenzCreatePayload {
  idFach: number | null
  istASV: boolean
  schulgliederung: string | null
  floskelText: string
  abschnitt: number
  istAktiv: boolean
  istSichtbar: boolean
  fachSortierung: number
  sortierung: number
  jahrgaengezuordnung: AnkreuzkompetenzJahrgangszuordnung[]
}

export interface AnkreuzkompetenzJahrgangszuordnungPayload {
  idAnkreuzkompetenz: number
  idJahrgang: number
}

export const ABSCHNITT_LABELS: Record<number, string> = {
  1: '1. HJ',
  2: '2. HJ',
  3: 'beide',
}
