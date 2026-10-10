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
  /** mismatch: Schüler-ID gefunden, aber Name/Geburtsdatum passen nicht dazu */
  _lookupStatus: 'pending' | 'ok' | 'not_found' | 'ambiguous' | 'mismatch'
  _erzieherartStatus: 'empty' | 'found' | 'new'
  _wohnortStatus: 'empty' | 'found' | 'not_found'
  _result?: 'angelegt' | 'ueberschrieben' | 'uebersprungen'
  // Identifikation des Schülers — Schüler-ID hat Vorrang vor Name + Geburtsdatum
  schuelerId: string
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
  /** ISO-3-Code, DEStatis-Schlüssel oder Bezeichnung, z. B. DEU / 000 / deutsch */
  staatsangehoerigkeit1: string
  // 2. Person (optional)
  anrede2: string
  titel2: string
  nachname2: string
  vorname2: string
  email2: string
  staatsangehoerigkeit2: string
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
  idStaatsangehoerigkeit: number | null
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
  ids: {
    idSchueler: number
    idErzieherArt: number | null
    wohnortID: number | null
    ortsteilID: number | null
    idStaatsangehoerigkeit: number | null
  },
): ErzieherStammdatenPayload {
  return {
    idSchueler: ids.idSchueler,
    idErzieherArt: ids.idErzieherArt,
    anrede: orNull(row.anrede1),
    titel: orNull(row.titel1),
    nachname: orNull(row.nachname1),
    vorname: orNull(row.vorname1),
    eMail: orNull(row.email1),
    idStaatsangehoerigkeit: ids.idStaatsangehoerigkeit,
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
export function erzieherPerson2Payload(
  row: SchuelerErzieherImportRow,
  idStaatsangehoerigkeit: number | null,
): ErzieherStammdatenPayload {
  return {
    anrede: orNull(row.anrede2),
    titel: orNull(row.titel2),
    nachname: orNull(row.nachname2),
    vorname: orNull(row.vorname2),
    eMail: orNull(row.email2),
    idStaatsangehoerigkeit,
  }
}

/** Antwort von GET /schueler/{id}/erzieher — eine Person je Objekt */
export interface ErzieherStammdaten {
  /** ID des DB-Eintrags × 10 + Position der Person (1 oder 2) */
  id: number
  idSchueler: number
  idErzieherArt: number | null
  titel: string | null
  anrede: string | null
  nachname: string | null
  vorname: string | null
  strassenname: string | null
  hausnummer: string | null
  hausnummerZusatz: string | null
  wohnortID: number | null
  ortsteilID: number | null
  erhaeltAnschreiben: boolean | null
  eMail: string | null
  idStaatsangehoerigkeit: number | null
  bemerkungen: string | null
}

/** Ein Erzieher-Eintrag mit 1. und optional 2. Person (gemeinsame Adresse) */
export interface ErzieherEintrag {
  /** ID des DB-Eintrags (ohne Positionsziffer) */
  id: number
  person1: ErzieherStammdaten
  person2: ErzieherStammdaten | null
}

/** Fasst die Personen eines Schülers anhand der Positionsziffer in der ID zu Einträgen zusammen */
export function gruppiereErzieherEintraege(personen: ErzieherStammdaten[]): ErzieherEintrag[] {
  const eintraege = new Map<number, { p1?: ErzieherStammdaten; p2?: ErzieherStammdaten }>()
  for (const p of personen) {
    const pos = p.id % 10
    const id = pos === 1 || pos === 2 ? Math.floor(p.id / 10) : p.id
    const e = eintraege.get(id) ?? {}
    if (pos === 2) e.p2 = p
    else e.p1 = p
    eintraege.set(id, e)
  }
  return [...eintraege.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, e]) => ({ id, person1: (e.p1 ?? e.p2)!, person2: e.p1 ? e.p2 ?? null : null }))
}
