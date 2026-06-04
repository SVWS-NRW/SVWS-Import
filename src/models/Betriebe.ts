export interface BetriebApiPayload {
  name: string | null
  nameZusatz: string | null
  bemerkungen: string | null
  branche: string | null
  strasse: string | null
  hausnummer: string | null
  hausnummerZusatz: string | null
  telefon1: string | null
  telefon2: string | null
  fax: string | null
  eMail: string | null
  istAusbildungsbetrieb: boolean
  istMassnahmentraeger: boolean
  belehrungNachISGErforderlich: boolean
  erweitertesFuehrungszeugnisErforderlich: boolean
  bietetPraktikumsplaetzeAn: boolean
  istSichtbar: boolean
}

export interface AnsprechpartnerApiPayload {
  idBetrieb: number
  anrede: string | null
  name: string | null
  rufname: string | null
  telefon: string | null
  eMail: string | null
}

export interface AnsprechpartnerDetails {
  id: number
  idBetrieb: number
  anrede: string | null
  name: string | null
  rufname: string | null
  telefon: string | null
  eMail: string | null
}

export interface BetriebDetails {
  id: number
  name: string | null
  nameZusatz: string | null
  branche: string | null
  strasse: string | null
  hausnummer: string | null
  telefon1: string | null
  eMail: string | null
  ansprechpartner: AnsprechpartnerDetails[]
  [key: string]: unknown
}

export interface BetriebImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  _serverError?: string
  _createdId?: number
  name: string
  nameZusatz: string
  bemerkungen: string
  branche: string
  strasse: string
  hausnummer: string
  hausnummerZusatz: string
  plz: string
  ort: string
  telefon1: string
  telefon2: string
  fax: string
  eMail: string
  istAusbildungsbetrieb: string
  istMassnahmentraeger: string
  belehrungNachISGErforderlich: string
  erweitertesFuehrungszeugnisErforderlich: string
  bietetPraktikumsplaetzeAn: string
  [key: string]: unknown
}

export interface AnsprechpartnerImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  _serverError?: string
  betriebName: string
  anrede: string
  name: string
  rufname: string
  telefon: string
  eMail: string
  [key: string]: unknown
}

function parseBool(v: string): boolean {
  return ['j', 'ja', 'true', '1', 'x', 'yes'].includes((v ?? '').toLowerCase().trim())
}

export function betriebImportToApi(row: BetriebImportRow): BetriebApiPayload {
  return {
    name: row.name?.trim() || null,
    nameZusatz: row.nameZusatz?.trim() || null,
    bemerkungen: row.bemerkungen?.trim() || null,
    branche: row.branche?.trim() || null,
    strasse: row.strasse?.trim() || null,
    hausnummer: row.hausnummer?.trim() || null,
    hausnummerZusatz: row.hausnummerZusatz?.trim() || null,
    telefon1: row.telefon1?.trim() || null,
    telefon2: row.telefon2?.trim() || null,
    fax: row.fax?.trim() || null,
    eMail: row.eMail?.trim() || null,
    istAusbildungsbetrieb: parseBool(row.istAusbildungsbetrieb),
    istMassnahmentraeger: parseBool(row.istMassnahmentraeger),
    belehrungNachISGErforderlich: parseBool(row.belehrungNachISGErforderlich),
    erweitertesFuehrungszeugnisErforderlich: parseBool(row.erweitertesFuehrungszeugnisErforderlich),
    bietetPraktikumsplaetzeAn: parseBool(row.bietetPraktikumsplaetzeAn),
    istSichtbar: true,
  }
}

export function ansprechpartnerImportToApi(row: AnsprechpartnerImportRow, idBetrieb: number): AnsprechpartnerApiPayload {
  return {
    idBetrieb,
    anrede: row.anrede?.trim() || null,
    name: row.name?.trim() || null,
    rufname: row.rufname?.trim() || null,
    telefon: row.telefon?.trim() || null,
    eMail: row.eMail?.trim() || null,
  }
}
