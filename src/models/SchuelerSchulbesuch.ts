export interface SchuelerSchulbesuchImportRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  _schuelerId: number | null
  _lookupStatus: 'pending' | 'ok' | 'not_found' | 'ambiguous'
  _vorherigeSchuleStatus: 'empty' | 'found' | 'new'
  _vorigeEntlassJahrgangStatus: 'empty' | 'valid' | 'invalid_kuerzel' | 'invalid_for_schulform'
  // Identifikation / Suchschlüssel
  nachname: string
  vorname: string
  geburtsdatum: string
  // Vorige Schule
  vorherigeSchule: string
  vorigeAllgHerkunft: string
  vorigeEntlassdatum: string
  vorigeEntlassjahrgang: string
  vorigeArtLetzteVersetzung: string
  vorigeEntlassgrundID: string
  vorigeBemerkung: string
  vorigeAbschlussartID: string
  // Entlassung von dieser Schule
  entlassungDatum: string
  idEntlassjahrgang: string
  entlassungGrundID: string
  entlassungAbschlussartID: string
  // Aufnehmende Schule
  idAufnehmendeSchule: string
  aufnehmendWechseldatum: string
  aufnehmendBestaetigt: string
  // Grundschule
  grundschuleEinschulungsjahr: string
  grundschuleEinschulungsartID: string
  idGrundschuleJahreEingangsphase: string
  idKuerzelGrundschuleUebergangsempfehlung: string
  // Sekundarstufe
  sekIWechsel: string
  sekIErsteSchulform: string
  sekIIWechsel: string
  // Kindergarten
  idDauerKindergartenbesuch: string
  idKindergarten: string
  // Sprachförderung
  verpflichtungSprachfoerderkurs: string
  teilnahmeSprachfoerderkurs: string
}

function parseBool(raw: string): boolean | null {
  if (!raw) return null
  const v = raw.toLowerCase().trim()
  if (['j', 'ja', 'true', '1', 'yes', 'x'].includes(v)) return true
  if (['n', 'nein', 'false', '0', 'no'].includes(v)) return false
  return null
}

function parseId(raw: string): number | null {
  if (!raw.trim()) return null
  const n = parseInt(raw.trim(), 10)
  return isNaN(n) ? null : n
}

export function schulbesuchImportToApiPatch(row: SchuelerSchulbesuchImportRow): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const str = (v: string) => v.trim()

  // Vorige Schule — idVorherigeSchule wird vom Store nach Schulnummer-Auflösung injiziert
  const idHerkunft = parseId(row.vorigeAllgHerkunft)
  if (idHerkunft !== null)                    patch.idHerkunftsartVersetzungVorherigeSchule              = idHerkunft
  if (str(row.vorigeEntlassdatum))            patch.entlassdatumVorherigeSchule                          = str(row.vorigeEntlassdatum)
  if (str(row.vorigeEntlassjahrgang))         patch.kuerzelEntlassjahrgangVorherigeSchule                = str(row.vorigeEntlassjahrgang)
  const idVorigeGrund = parseId(row.vorigeEntlassgrundID)
  if (idVorigeGrund !== null)                 patch.idEntlassgrundVorherigeSchule                        = idVorigeGrund
  if (str(row.vorigeBemerkung))               patch.bemerkungVorherigeSchule                             = str(row.vorigeBemerkung)
  if (str(row.vorigeAbschlussartID))          patch.schluesselAbschlussartAllgemeinbildendVorherigeSchule = str(row.vorigeAbschlussartID)

  // Entlassung von dieser Schule
  if (str(row.entlassungDatum))               patch.entlassdatumDieseSchule               = str(row.entlassungDatum)
  const idEntlJg = parseId(row.idEntlassjahrgang)
  if (idEntlJg !== null)                      patch.idEntlassjahrgangDieseSchule          = idEntlJg
  const idEntlGrund = parseId(row.entlassungGrundID)
  if (idEntlGrund !== null)                   patch.idEntlassgrundDieseSchule             = idEntlGrund
  const idEntlAbs = parseId(row.entlassungAbschlussartID)
  if (idEntlAbs !== null)                     patch.idAbschlussartDieseSchule             = idEntlAbs

  // Aufnehmende Schule
  const idAufn = parseId(row.idAufnehmendeSchule)
  if (idAufn !== null)                        patch.idAufnehmendeSchule                   = idAufn
  if (str(row.aufnehmendWechseldatum))        patch.wechseldatumAufnehmendeSchule         = str(row.aufnehmendWechseldatum)
  const bestaetigt = parseBool(row.aufnehmendBestaetigt)
  if (bestaetigt !== null)                    patch.wechselBestaetigtAufnehmendeSchule    = bestaetigt

  // Grundschule
  const gsJahr = parseId(row.grundschuleEinschulungsjahr)
  if (gsJahr !== null)                        patch.einschulungsjahrGrundschule           = gsJahr
  const gsArt = parseId(row.grundschuleEinschulungsartID)
  if (gsArt !== null)                         patch.idEinschulungsartGrundschule          = gsArt
  const gsPhase = parseId(row.idGrundschuleJahreEingangsphase)
  if (gsPhase !== null)                       patch.idEingangsphaseGrundschule            = gsPhase
  const gsUe = parseId(row.idKuerzelGrundschuleUebergangsempfehlung)
  if (gsUe !== null)                          patch.idUebergangsempfehlungGrundschule     = gsUe

  // Sekundarstufe
  const sekI = parseId(row.sekIWechsel)
  if (sekI !== null)                          patch.wechseljahrSekI                       = sekI
  if (str(row.sekIErsteSchulform))            patch.kuerzelErsteSchulformSek1             = str(row.sekIErsteSchulform)
  const sekII = parseId(row.sekIIWechsel)
  if (sekII !== null)                         patch.wechseljahrSekII                      = sekII

  // Kindergarten
  const idDauerKg = parseId(row.idDauerKindergartenbesuch)
  if (idDauerKg !== null)                     patch.idDauerKindergartenbesuch             = idDauerKg
  const idKg = parseId(row.idKindergarten)
  if (idKg !== null)                          patch.idKindergarten                        = idKg

  // Sprachförderung
  const verpfl = parseBool(row.verpflichtungSprachfoerderkurs)
  if (verpfl !== null)                        patch.verpflichtungSprachfoerderkurs        = verpfl
  const teiln = parseBool(row.teilnahmeSprachfoerderkurs)
  if (teiln !== null)                         patch.teilnahmeSprachfoerderkurs            = teiln

  return patch
}
