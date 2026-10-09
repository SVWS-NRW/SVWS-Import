/**
 * Erzieherdaten zu Schülern. Eine Zeile entspricht einem Erzieher-Eintrag in SVWS,
 * der bis zu zwei Personen enthalten kann (1. Person / 2. Person, gemeinsame Adresse).
 */
export interface SchuelerErzieherImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  _schuelerId: number | null
  _lookupStatus: 'pending' | 'ok' | 'not_found' | 'ambiguous'
  _erzieherartStatus: 'empty' | 'found' | 'new'
  _wohnortStatus: 'empty' | 'found' | 'not_found'
  _result?: 'angelegt' | 'uebersprungen'
  // Identifikation des Schülers
  nachname: string
  vorname: string
  geburtsdatum: string
  // Eintrag
  erzieherart: string
  // 1. Person
  anrede1: string
  titel1: string
  nachname1: string
  vorname1: string
  email1: string
  // 2. Person (optional)
  anrede2: string
  titel2: string
  nachname2: string
  vorname2: string
  email2: string
  // gemeinsame Adresse
  strassenname: string
  hausnummer: string
  hausnummerZusatz: string
  plz: string
  ort: string
  ortsteil: string
  erhaeltAnschreiben: string
  bemerkungen: string
}

/** Request-Body für POST /schueler/erzieher/new/{idSchueler}/{pos} und PATCH /erzieher/{id}/stammdaten/{pos} */
export interface ErzieherStammdatenPayload {
  idSchueler?: number
  idErzieherArt?: number | null
  anrede: string | null
  titel: string | null
  nachname: string | null
  vorname: string | null
  eMail: string | null
  strassenname?: string | null
  hausnummer?: string | null
  hausnummerZusatz?: string | null
  wohnortID?: number | null
  ortsteilID?: number | null
  erhaeltAnschreiben?: boolean | null
  bemerkungen?: string | null
}

const orNull = (v: string): string | null => v.trim() || null

export function parseAnschreiben(raw: string): boolean | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null
  return ['j', 'ja', 'true', '1', 'x'].includes(s)
}

export function hatZweitePerson(row: SchuelerErzieherImportRow): boolean {
  return !!(row.nachname2.trim() || row.vorname2.trim())
}

/** 1. Person inkl. Erzieherart und gemeinsamer Adresse */
export function erzieherPerson1Payload(
  row: SchuelerErzieherImportRow,
  ids: { idSchueler: number; idErzieherArt: number | null; wohnortID: number | null; ortsteilID: number | null },
): ErzieherStammdatenPayload {
  return {
    idSchueler: ids.idSchueler,
    idErzieherArt: ids.idErzieherArt,
    anrede: orNull(row.anrede1),
    titel: orNull(row.titel1),
    nachname: orNull(row.nachname1),
    vorname: orNull(row.vorname1),
    eMail: orNull(row.email1),
    strassenname: orNull(row.strassenname),
    hausnummer: orNull(row.hausnummer),
    hausnummerZusatz: orNull(row.hausnummerZusatz),
    wohnortID: ids.wohnortID,
    ortsteilID: ids.ortsteilID,
    erhaeltAnschreiben: parseAnschreiben(row.erhaeltAnschreiben),
    bemerkungen: orNull(row.bemerkungen),
  }
}

/** 2. Person — Adresse und Erzieherart gelten für den gesamten Eintrag */
export function erzieherPerson2Payload(row: SchuelerErzieherImportRow): ErzieherStammdatenPayload {
  return {
    anrede: orNull(row.anrede2),
    titel: orNull(row.titel2),
    nachname: orNull(row.nachname2),
    vorname: orNull(row.vorname2),
    eMail: orNull(row.email2),
  }
}
