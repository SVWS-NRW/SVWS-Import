export interface Floskelgruppe {
  id: number
  kuerzel: string
  bezeichnung: string
  idFloskelgruppenart?: number
  referenziertInAnderenTabellen?: boolean
}

export const FLOSKELGRUPPENARTEN = new Map<number, { kuerzel: string; text: string }>([
  [0,  { kuerzel: 'ALLG',  text: 'Allgemeine Floskeln' }],
  [1,  { kuerzel: 'ASV',   text: 'Floskeln für Arbeits- und Sozialverhalten' }],
  [2,  { kuerzel: 'AUE',   text: 'Floskeln für außerunterrichtliches Engagement' }],
  [3,  { kuerzel: 'FACH',  text: 'Fachbezogene Floskeln' }],
  [4,  { kuerzel: 'FSP',   text: 'Bemerkungen zum Förderschwerpunkt' }],
  [5,  { kuerzel: 'FOERD', text: 'Floskeln für Fördermaßnahmen' }],
  [6,  { kuerzel: 'VERM',  text: 'Floskeln für Vermerke' }],
  [7,  { kuerzel: 'VERS',  text: 'Bemerkung zur Versetzung' }],
  [8,  { kuerzel: 'ZB',    text: 'Floskeln für Zeugnisbemerkungen' }],
  [9,  { kuerzel: 'LELS',  text: 'Floskeln für allgemeine Lernentwicklung und Leistungsstand' }],
  [10, { kuerzel: 'ÜG45',  text: 'Floskeln für die Übergangsempfehlung 4 nach 5' }],
])

export interface Floskel {
  id: number
  kuerzel: string
  text: string
  idFloskelgruppe: number
  idFach: number | null
  niveau: number | null
  sortierung: number
  idsJahrgaenge: number[]
}

export interface FloskelImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  kuerzel: string
  text: string
  /** Kürzel der Gruppe – wird zur Laufzeit zu idFloskelgruppe aufgelöst */
  floskelgruppe: string
  /** Direkte numerische Gruppen-ID aus der Datei (hat Vorrang vor floskelgruppe) */
  idFloskelgruppe: string
  /** Fach-Kürzel (z. B. "D", "M") */
  fach: string
  /** Jahrgangs-Kürzel oder kommagetrennte IDs */
  jahrgang: string
  /** Niveau als Zahl-String (z. B. "01") oder Kürzel */
  niveau: string
  /** Sortierung, Default 32000 wenn leer */
  sortierung: string
  [key: string]: unknown
}

export interface FloskelApiPayload {
  kuerzel: string
  text: string
  idFloskelgruppe: number
  idFach: number | null
  niveau: number | null
  sortierung: number
  idsJahrgaenge: number[]
}
