import { getApiClient } from './apiClient'
import { toAppError } from './errorService'
import type { SchuelerNeu, SchuelerImportRow } from '@/models/Schueler'
import type { LehrerStammdaten, LehrerImportRow } from '@/models/Lehrer'
import type { KlasseImportRow, KlasseDetails } from '@/models/Klassen'
import type { JahrgangImportRow, JahrgangDetails } from '@/models/Jahrgaenge'
import type { FachImportRow, FachDetails } from '@/models/Faecher'
import type { SchuleStammdaten, Schuljahresabschnitt } from '@/models/Schule'
import { schuelerImportToApi } from '@/models/Schueler'
import { lehrerImportToApi } from '@/models/Lehrer'
import { klasseImportToApi } from '@/models/Klassen'
import { jahrgangImportToApi } from '@/models/Jahrgaenge'
import { fachImportToApi } from '@/models/Faecher'
import type { ImportModule, MappedRow, ImportContext, EntityType, OrtKatalogEintrag, ReligionKatalogEintrag } from '@/models/ImportSchema'
import { betriebImportToApi, ansprechpartnerImportToApi, type BetriebImportRow, type BetriebDetails, type AnsprechpartnerImportRow } from '@/models/Betriebe'
import { ortsteilImportToApi, type OrtsteilImportRow, type OrtsteilDetails } from '@/models/Ortsteile'
import { resolveWohnortId, resolveReligionId, resolveNationalitaet, resolveVerkehrssprache, resolveNationalitaetId } from './katalogService'
import type { Floskelgruppe, Floskel, FloskelApiPayload } from '@/models/Floskel'
import type {
  Ankreuzkompetenz,
  AnkreuzkompetenzCreatePayload,
  AnkreuzkompetenzJahrgangszuordnungPayload,
} from '@/models/Ankreuzkompetenz'

export type { Floskelgruppe, Floskel }
export type { Ankreuzkompetenz }

export async function fetchFloskelgruppen(): Promise<Floskelgruppe[]> {
  const response = await getApiClient().get('/schule/floskelgruppen')
  return Array.isArray(response.data) ? response.data : []
}

export async function fetchFloskeln(): Promise<Floskel[]> {
  const response = await getApiClient().get('/schule/floskeln')
  return Array.isArray(response.data) ? response.data : []
}

export async function deleteFloskelgruppen(ids: number[]): Promise<UploadResult> {
  try {
    await getApiClient().delete('/schule/floskelgruppen/delete/multiple', { data: ids })
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function deleteFloskeln(ids: number[]): Promise<UploadResult> {
  try {
    await getApiClient().delete('/schule/floskeln/delete/multiple', { data: ids })
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export interface FloskelgruppeCreatePayload {
  kuerzel: string
  bezeichnung: string
  idFloskelgruppenart: number
}

export async function createFloskelgruppe(payload: FloskelgruppeCreatePayload): Promise<UploadResult> {
  try {
    const response = await getApiClient().post('/schule/floskelgruppen/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function createFloskel(payload: FloskelApiPayload): Promise<UploadResult> {
  try {
    const response = await getApiClient().post('/schule/floskeln/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchAnkreuzkompetenzen(): Promise<Ankreuzkompetenz[]> {
  const response = await getApiClient().get('/schule/ankreuzkompetenzen')
  return Array.isArray(response.data) ? response.data : []
}

export async function createAnkreuzkompetenz(payload: AnkreuzkompetenzCreatePayload): Promise<UploadResult> {
  try {
    const response = await getApiClient().post('/schule/ankreuzkompetenzen/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    const appError = toAppError(error)
    return { success: false, error: appError.messageUser, errorDetail: appError.messageTechnical }
  }
}

export async function deleteAnkreuzkompetenzen(ids: number[]): Promise<UploadResult> {
  try {
    await getApiClient().delete('/schule/ankreuzkompetenzen/delete/multiple', { data: ids })
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function addAnkreuzkompetenzJahrgangszuordnungen(
  payload: AnkreuzkompetenzJahrgangszuordnungPayload[],
): Promise<UploadResult> {
  try {
    await getApiClient().post('/schule/ankreuzkompetenzen/jahrgangzuordnung', payload)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function deleteAnkreuzkompetenzJahrgangszuordnungen(ids: number[]): Promise<UploadResult> {
  try {
    await getApiClient().delete('/schule/ankreuzkompetenzen/jahrgangzuordnung/delete/multiple', { data: ids })
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export interface UploadResult {
  success: boolean
  id?: number
  error?: string
  errorDetail?: string
}

interface SchuelerLernabschnitt {
  id: number
  wechselNr: number
  klassenID: number | null
}

function parseBoolean(raw: string): boolean | null {
  if (!raw) return null
  const v = raw.toLowerCase().trim()
  if (['j', 'ja', 'true', '1', 'yes', 'x'].includes(v)) return true
  if (['n', 'nein', 'false', '0', 'no'].includes(v)) return false
  return null
}

function resolveByKuerzel(map: Map<string, number>, kuerzel: string): number | null {
  if (!kuerzel) return null
  return map.get(kuerzel.trim().toLowerCase()) ?? null
}

export function buildKlassenMap(klassen: KlasseDetails[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const k of klassen) {
    if (k.kuerzel) map.set(k.kuerzel.trim().toLowerCase(), k.id)
  }
  return map
}

export function buildJahrgaengeMap(jahrgaenge: JahrgangDetails[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const j of jahrgaenge) {
    if (j.kuerzel) map.set(j.kuerzel.trim().toLowerCase(), j.id)
    // kuerzelStatistik als Fallback (oft identisch, aber sicher)
    if (j.kuerzelStatistik) map.set(j.kuerzelStatistik.trim().toLowerCase(), j.id)
  }
  return map
}

// Endpunkte je Entitätstyp — hier neue Module eintragen wenn der SVWS-Endpunkt bekannt ist
const ENTITY_ENDPOINTS: Partial<Record<EntityType, string>> = {
  schueler: '/schueler/create',
  lehrer:   '/lehrer/create',
  klassen:   '/klassen/create',
  jahrgaenge: '/jahrgaenge/create',
  faecher: '/faecher/create',
}

export async function testConnection(): Promise<boolean> {
  try {
    await getApiClient().get('/lehrer')
    return true
  } catch {
    return false
  }
}

/**
 * Schickt eine gemappte Zeile über das jeweilige Modul-Schema an den SVWS-Server.
 * Verwendet module.toApiPayload() zur Transformation und leitet an den richtigen Endpunkt.
 */
export async function sendMappedRow(
  module: ImportModule,
  row: MappedRow,
  context: ImportContext,
): Promise<UploadResult> {
  if (!module.toApiPayload) {
    return { success: false, error: `Modul "${module.id}" hat keine toApiPayload-Funktion` }
  }
  const endpoint = ENTITY_ENDPOINTS[module.entityType]
  if (!endpoint) {
    return { success: false, error: `Kein API-Endpunkt für Entitätstyp "${module.entityType}" konfiguriert` }
  }
  try {
    const payload = module.toApiPayload(row, context)
    const response = await getApiClient().post(endpoint, payload)
    const newId: number = response.data?.id

    if (module.entityType === 'schueler' && newId) {
      await patchSchuelerAfterCreate(newId, row, context)
    }

    return { success: true, id: newId }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

async function patchSchuelerAfterCreate(
  newId: number,
  row: MappedRow,
  context: ImportContext,
): Promise<void> {
  const str = (key: string) => String(row[key] ?? '').trim()

  // ── Stammdaten-Patch ───────────────────────────────────────────────────────
  const stammdatenPatch: Record<string, unknown> = {}
  if (str('geburtsname'))  stammdatenPatch.geburtsname  = str('geburtsname')
  if (str('geburtsort'))   stammdatenPatch.geburtsort   = str('geburtsort')
  if (str('strassenname')) stammdatenPatch.strassenname = str('strassenname')
  if (str('hausnummer'))   stammdatenPatch.hausnummer   = str('hausnummer')
  if (str('telefon'))      stammdatenPatch.telefon      = str('telefon')
  if (str('email'))        stammdatenPatch.emailPrivat  = str('email')

  const resolvedNat = resolveNationalitaet(context.kataloge?.nationalitaeten, str('staatsangehoerigkeitID'))
  if (resolvedNat) stammdatenPatch.staatsangehoerigkeitID = resolvedNat

  // Herkunft / Migration
  if (str('zuzugsjahr'))         stammdatenPatch.zuzugsjahr         = parseInt(str('zuzugsjahr'), 10) || null
  if (str('verkehrspracheFamilie')) stammdatenPatch.verkehrspracheFamilie = resolveVerkehrssprache(context.kataloge?.verkehrssprachen, str('verkehrspracheFamilie'))
  if (str('geburtsland'))        stammdatenPatch.geburtsland        = resolveNationalitaet(context.kataloge?.nationalitaeten, str('geburtsland'))
  if (str('geburtslandVater'))   stammdatenPatch.geburtslandVater   = resolveNationalitaet(context.kataloge?.nationalitaeten, str('geburtslandVater'))
  if (str('geburtslandMutter'))  stammdatenPatch.geburtslandMutter  = resolveNationalitaet(context.kataloge?.nationalitaeten, str('geburtslandMutter'))

  const hasMigrationData = !!(str('zuzugsjahr') || str('geburtsland') || str('verkehrspracheFamilie') || str('geburtslandVater') || str('geburtslandMutter'))
  if (hasMigrationData) {
    stammdatenPatch.hatMigrationshintergrund = true
  } else {
    const migration = parseBoolean(str('hatMigrationshintergrund'))
    if (migration !== null) stammdatenPatch.hatMigrationshintergrund = migration
  }

  if (context.kataloge?.orte) {
    const wohnortID = resolveWohnortId(context.kataloge.orte, str('plz'), str('ort'))
    if (wohnortID !== null) {
      stammdatenPatch.wohnortID  = wohnortID
      stammdatenPatch.ortsteilID = null
    }
  }

  if (context.kataloge?.religionen) {
    const religionID = resolveReligionId(
      context.kataloge.religionen,
      str('religionKuerzel'),
      str('religionID'),
    )
    if (religionID !== null) stammdatenPatch.religionID = religionID
  }

  if (Object.keys(stammdatenPatch).length > 0) {
    await getApiClient().patch(`/schueler/${newId}/stammdaten`, stammdatenPatch)
  }

  // ── Lernabschnitt-Patch ────────────────────────────────────────────────────
  const lernabschnittPatch: Record<string, unknown> = {}

  if (context.kataloge?.klassen) {
    const klassenID = resolveByKuerzel(context.kataloge.klassen, str('klasse'))
    if (klassenID !== null) lernabschnittPatch.klassenID = klassenID
  }

  if (context.kataloge?.jahrgaenge) {
    const jahrgangID = resolveByKuerzel(context.kataloge.jahrgaenge, str('jahrgang'))
    if (jahrgangID !== null) lernabschnittPatch.jahrgangID = jahrgangID
  }

  if (Object.keys(lernabschnittPatch).length > 0 && context.idSchuljahresabschnitt) {
    const laResp = await getApiClient().get<SchuelerLernabschnitt[]>(
      `/schueler/lernabschnittsdaten/${newId}/${context.idSchuljahresabschnitt}`,
    )
    const lernabschnitt = laResp.data.find(la => la.wechselNr === 0) ?? laResp.data[0]
    if (lernabschnitt?.id) {
      await getApiClient().patch(
        `/schueler/lernabschnittsdaten/${lernabschnitt.id}`,
        lernabschnittPatch,
      )
    }
  }
}

// ── Veraltete, typenspezifische Funktionen (für SchuelerView / LehrerView) ──

export async function createSchueler(
  row: SchuelerImportRow,
  idSchuljahresabschnitt: number,
  orteKatalog?: Map<string, import('@/models/ImportSchema').OrtKatalogEintrag>,
  religionenKatalog?: Map<string, import('@/models/ImportSchema').ReligionKatalogEintrag>,
  klassenMap?: Map<string, number>,
  jahrgaengeMap?: Map<string, number>,
  nationalitaetenKatalog?: Map<string, string>,
  verkehrssprachen?: Map<string, string>,
): Promise<UploadResult> {
  try {
    const payload: SchuelerNeu = schuelerImportToApi(row, idSchuljahresabschnitt)
    const response = await getApiClient().post('/schueler/create', payload)
    const newId: number = response.data.id

    // ── Stammdaten-Patch (Adresse, Kontakt, Religion, Herkunft) ─────────────
    const stammdatenPatch: Record<string, unknown> = {}
    // Personaldaten
    if (row.geburtsname)              stammdatenPatch.geburtsname             = row.geburtsname
    if (row.geburtsort)               stammdatenPatch.geburtsort              = row.geburtsort
    const resolvedNat1 = resolveNationalitaet(nationalitaetenKatalog, row.staatsangehoerigkeitID)
    if (resolvedNat1)                 stammdatenPatch.staatsangehoerigkeitID  = resolvedNat1
    if (row.geburtsland)              stammdatenPatch.geburtsland             = resolveNationalitaet(nationalitaetenKatalog, row.geburtsland)
    if (row.staatsangehoerigkeit2ID)  stammdatenPatch.staatsangehoerigkeit2ID = resolveNationalitaet(nationalitaetenKatalog, row.staatsangehoerigkeit2ID)
    const drucke = parseBoolean(row.druckeKonfessionAufZeugnisse)
    if (drucke !== null)              stammdatenPatch.druckeKonfessionAufZeugnisse = drucke
    if (row.religionanmeldung)        stammdatenPatch.religionanmeldung       = row.religionanmeldung
    if (row.religionabmeldung)        stammdatenPatch.religionabmeldung       = row.religionabmeldung
    // Herkunft / Migration
    if (row.zuzugsjahr)               stammdatenPatch.zuzugsjahr              = parseInt(row.zuzugsjahr, 10) || null
    if (row.verkehrspracheFamilie)    stammdatenPatch.verkehrspracheFamilie   = resolveVerkehrssprache(verkehrssprachen, row.verkehrspracheFamilie)
    if (row.geburtslandVater)         stammdatenPatch.geburtslandVater        = resolveNationalitaet(nationalitaetenKatalog, row.geburtslandVater)
    if (row.geburtslandMutter)        stammdatenPatch.geburtslandMutter       = resolveNationalitaet(nationalitaetenKatalog, row.geburtslandMutter)
    // hatMigrationshintergrund: true wenn Herkunftsfelder gesetzt, sonst expliziten Wert nehmen
    const hasMigrationData = !!(row.zuzugsjahr || row.geburtsland || row.verkehrspracheFamilie || row.geburtslandVater || row.geburtslandMutter)
    if (hasMigrationData) {
      stammdatenPatch.hatMigrationshintergrund = true
    } else {
      const migration = parseBoolean(row.hatMigrationshintergrund)
      if (migration !== null) stammdatenPatch.hatMigrationshintergrund = migration
    }
    // Adresse
    if (row.strassenname)             stammdatenPatch.strassenname            = row.strassenname
    if (row.hausnummer)               stammdatenPatch.hausnummer              = row.hausnummer
    if (row.hausnummerZusatz)         stammdatenPatch.hausnummerZusatz        = row.hausnummerZusatz
    // Kontakt
    if (row.telefon)                  stammdatenPatch.telefon                 = row.telefon
    if (row.telefonMobil)             stammdatenPatch.telefonMobil            = row.telefonMobil
    if (row.email)                    stammdatenPatch.emailPrivat             = row.email
    if (row.emailSchule)              stammdatenPatch.emailSchule             = row.emailSchule
    // Sonstiges
    if (row.externeSchulNr)           stammdatenPatch.externeSchulNr          = row.externeSchulNr
    if (row.beruf)                    stammdatenPatch.beruf                   = row.beruf
    const masern = parseBoolean(row.hatMasernimpfnachweis)
    if (masern !== null)              stammdatenPatch.hatMasernimpfnachweis   = masern
    const keineAuskunft = parseBoolean(row.keineAuskunftAnDritte)
    if (keineAuskunft !== null)       stammdatenPatch.keineAuskunftAnDritte   = keineAuskunft
    const bafoeg = parseBoolean(row.erhaeltSchuelerBAFOEG)
    if (bafoeg !== null)              stammdatenPatch.erhaeltSchuelerBAFOEG   = bafoeg
    const meisterBafoeg = parseBoolean(row.erhaeltMeisterBAFOEG)
    if (meisterBafoeg !== null)       stammdatenPatch.erhaeltMeisterBAFOEG    = meisterBafoeg

    if (orteKatalog) {
      const wohnortID = resolveWohnortId(orteKatalog, row.plz, row.ort)
      if (wohnortID !== null) {
        // wohnortID und ortsteilID müssen immer zusammen gepatcht werden (API-Anforderung)
        stammdatenPatch.wohnortID  = wohnortID
        stammdatenPatch.ortsteilID = null
      }
    }

    if (religionenKatalog) {
      const religionID = resolveReligionId(religionenKatalog, row.religionKuerzel, row.religionID)
      if (religionID !== null) stammdatenPatch.religionID = religionID
    }

    if (Object.keys(stammdatenPatch).length > 0) {
      await getApiClient().patch(`/schueler/${newId}/stammdaten`, stammdatenPatch)
    }

    // ── Lernabschnitt-Patch (Klasse + Jahrgang) ──────────────────────────────
    const lernabschnittPatch: Record<string, unknown> = {}
    if (klassenMap) {
      const klassenID = resolveByKuerzel(klassenMap, row.klasse)
      if (klassenID !== null) lernabschnittPatch.klassenID = klassenID
    }
    if (jahrgaengeMap) {
      const jahrgangID = resolveByKuerzel(jahrgaengeMap, row.jahrgang)
      if (jahrgangID !== null) lernabschnittPatch.jahrgangID = jahrgangID
    }

    if (Object.keys(lernabschnittPatch).length > 0) {
      const laResp = await getApiClient().get<SchuelerLernabschnitt[]>(
        `/schueler/lernabschnittsdaten/${newId}/${idSchuljahresabschnitt}`,
      )
      const lernabschnitt = laResp.data.find(la => la.wechselNr === 0) ?? laResp.data[0]
      if (lernabschnitt?.id) {
        await getApiClient().patch(
          `/schueler/lernabschnittsdaten/${lernabschnitt.id}`,
          lernabschnittPatch,
        )
      }
    }

    return { success: true, id: newId }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function createLehrer(
  row: LehrerImportRow,
  nationalitaetenById?: Map<string, number>,
  orteKatalog?: Map<string, OrtKatalogEintrag>,
): Promise<UploadResult> {
  try {
    const payload: LehrerStammdaten = lehrerImportToApi(row)
    if (row.staatsangehoerigkeitID) {
      const id = resolveNationalitaetId(nationalitaetenById, row.staatsangehoerigkeitID)
      if (id !== null) payload.idStaatsangehoerigkeit = id
    }
    if (orteKatalog) {
      payload.wohnortID = resolveWohnortId(orteKatalog, row.plz, row.ort)
    }
    const response = await getApiClient().post('/lehrer/create', payload)
    return { success: true, id: response.data.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export interface LehrkraftListEntry {
  id: number
  kuerzel: string
}

export async function fetchLehrkraefte(): Promise<LehrkraftListEntry[]> {
  const response = await getApiClient().get('/lehrer')
  return Array.isArray(response.data) ? response.data : []
}

export async function fetchJahrgaenge(): Promise<JahrgangDetails[]> {
  const response = await getApiClient().get('/jahrgaenge')
  return Array.isArray(response.data) ? response.data : []
}

export async function createJahrgang(row: JahrgangImportRow): Promise<UploadResult> {
  try {
    const payload = jahrgangImportToApi(row)
    const response = await getApiClient().post('/jahrgaenge/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchFaecher(): Promise<FachDetails[]> {
  const response = await getApiClient().get('/faecher')
  return Array.isArray(response.data) ? response.data : []
}

export async function createFach(row: FachImportRow): Promise<UploadResult> {
  try {
    const payload = fachImportToApi(row)
    const response = await getApiClient().post('/faecher/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchBetriebe(): Promise<BetriebDetails[]> {
  const response = await getApiClient().get('/schule/betriebe')
  return Array.isArray(response.data) ? response.data : []
}

export async function createBetrieb(
  row: BetriebImportRow,
  orteMap?: Map<string, OrtKatalogEintrag>,
): Promise<UploadResult> {
  try {
    const payload = betriebImportToApi(row)
    const idOrt = orteMap ? resolveWohnortId(orteMap, row.plz ?? '', row.ort ?? '') : null
    const response = await getApiClient().post('/schule/betriebe/create', payload)
    const newId: number = response.data?.id
    if (newId) {
      await patchBetriebAfterCreate(newId, row, idOrt)
    }
    return { success: true, id: newId }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

async function patchBetriebAfterCreate(
  id: number,
  row: BetriebImportRow,
  idOrt: number | null,
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (row.strasse?.trim())           patch.strasse           = row.strasse.trim()
  if (row.hausnummer?.trim())        patch.hausnummer        = row.hausnummer.trim()
  if (row.hausnummerZusatz?.trim())  patch.hausnummerZusatz  = row.hausnummerZusatz.trim()
  if (idOrt !== null)                patch.idOrt             = idOrt
  if (Object.keys(patch).length > 0) {
    await getApiClient().patch(`/schule/betriebe/${id}`, patch)
  }
}

export async function createAnsprechpartner(row: AnsprechpartnerImportRow, idBetrieb: number): Promise<UploadResult> {
  try {
    const payload = ansprechpartnerImportToApi(row, idBetrieb)
    const response = await getApiClient().post('/schule/betriebe-ansprechpartner/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchSchuleStammdaten(): Promise<SchuleStammdaten> {
  const response = await getApiClient().get('/schule/stammdaten')
  return response.data
}

export async function fetchSchuljahresabschnitte(): Promise<Schuljahresabschnitt[]> {
  const stammdaten = await fetchSchuleStammdaten()
  const abschnitte = stammdaten.schuljahresabschnitte
  return Array.isArray(abschnitte) ? abschnitte : []
}

export async function createSchuljahresabschnitt(schuljahr: number, abschnitt: number): Promise<UploadResult> {
  const endpointCandidates = [
    '/schule/schuljahresabschnitte/create',
    '/schule/schuljahresabschnitt/create',
    '/schuljahresabschnitte/create',
  ]
  const payloadCandidates = [
    { schuljahr, abschnitt },
    { jahr: schuljahr, abschnitt },
  ]

  for (const endpoint of endpointCandidates) {
    for (const payload of payloadCandidates) {
      try {
        const response = await getApiClient().post(endpoint, payload)
        return { success: true, id: response.data?.id }
      } catch (error: unknown) {
        const status =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined

        // Endpoint/Payload-Varianten bei 404/405/400 durchprobieren.
        if (status === 404 || status === 405 || status === 400) continue
        return { success: false, error: toAppError(error).messageUser }
      }
    }
  }

  return {
    success: false,
    error: 'Schuljahresabschnitt konnte nicht angelegt werden (unbekannter API-Endpunkt oder ungültiges Payload).',
  }
}

export async function fetchKlassenDetails(idSchuljahresabschnitt: number): Promise<KlasseDetails[]> {
  const response = await getApiClient().get(`/klassen/details/abschnitt/${idSchuljahresabschnitt}`)
  return Array.isArray(response.data) ? response.data : []
}

export async function createKlasse(row: KlasseImportRow, idSchuljahresabschnitt: number): Promise<UploadResult> {
  try {
    const payload = klasseImportToApi(row, idSchuljahresabschnitt)
    const response = await getApiClient().post('/klassen/create', payload)
    const newId: number = response.data?.id
    if (newId && row.idKlassenlehrer !== null) {
      await getApiClient().patch(`/klassen/${newId}`, { klassenLeitungen: [row.idKlassenlehrer] })
    }
    return { success: true, id: newId }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchOrtsteile(): Promise<OrtsteilDetails[]> {
  const response = await getApiClient().get('/ortsteile')
  return Array.isArray(response.data) ? response.data : []
}

export async function createOrtsteil(
  row: OrtsteilImportRow,
  orteMap?: Map<string, OrtKatalogEintrag>,
): Promise<UploadResult> {
  try {
    const ortId = orteMap ? resolveWohnortId(orteMap, row.plz, row.ort) : null
    const payload = ortsteilImportToApi(row, ortId)
    const response = await getApiClient().post('/ortsteile/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchOrteById(): Promise<Map<number, OrtKatalogEintrag>> {
  const response = await getApiClient().get<OrtKatalogEintrag[]>('/orte')
  const map = new Map<number, OrtKatalogEintrag>()
  for (const entry of response.data) {
    if (entry.id) map.set(entry.id, entry)
  }
  return map
}

export async function fetchReligionenById(): Promise<Map<number, ReligionKatalogEintrag>> {
  const response = await getApiClient().get<ReligionKatalogEintrag[]>('/schule/religionen')
  const map = new Map<number, ReligionKatalogEintrag>()
  for (const entry of response.data) {
    if (entry.id) map.set(entry.id, entry)
  }
  return map
}

export async function fetchSchulenById(): Promise<Map<number, string>> {
  const response = await getApiClient().get<SchulEintrag[]>('/schule/schulen')
  const map = new Map<number, string>()
  for (const s of response.data) {
    if (s.id && s.schulnummerStatistik) map.set(s.id, s.schulnummerStatistik)
  }
  return map
}

export async function fetchJahrgaengeById(): Promise<Map<number, string>> {
  const response = await getApiClient().get<{ id: number; kuerzel?: string | null }[]>('/jahrgaenge')
  const map = new Map<number, string>()
  for (const j of response.data) {
    if (j.id && j.kuerzel) map.set(j.id, j.kuerzel)
  }
  return map
}

export async function fetchEinschulungsartenById(): Promise<Map<number, string>> {
  const response = await getApiClient().get<{ id: number; text: string }[]>('/schule/allgemein/einschulungsarten')
  const map = new Map<number, string>()
  for (const e of response.data) {
    if (e.id && e.text) map.set(e.id, e.text)
  }
  return map
}

export async function fetchUebergangsempfehlungenById(): Promise<Map<number, string>> {
  const response = await getApiClient().get<{ id: number; text: string }[]>('/schueler/allgemein/uebergangsempfehlung')
  const map = new Map<number, string>()
  for (const e of response.data) {
    if (e.id && e.text) map.set(e.id, e.text)
  }
  return map
}

export async function fetchKindergartenbesuchsdauerById(): Promise<Map<number, string>> {
  const response = await getApiClient().get<{ id: number; text: string }[]>('/schule/allgemein/kindergartenbesuch')
  const map = new Map<number, string>()
  for (const e of response.data) {
    if (e.id && e.text) map.set(e.id, e.text)
  }
  return map
}

export async function fetchKindergartenById(): Promise<Map<number, string>> {
  const response = await getApiClient().get<{ id: number; bezeichnung: string }[]>('/kindergaerten')
  const map = new Map<number, string>()
  for (const k of response.data) {
    if (k.id && k.bezeichnung) map.set(k.id, k.bezeichnung)
  }
  return map
}

export async function fetchForExport(endpoint: string): Promise<Record<string, unknown>[]> {
  const response = await getApiClient().get(endpoint)
  return Array.isArray(response.data) ? response.data : []
}

export interface SchuelerAuswahl {
  id: number
  nachname: string
  vorname: string
  status: number
  idKlasse?: number
  klasse?: string
  jahrgang?: string
  [key: string]: unknown
}

export async function enrichRecords(
  records: Array<Record<string, unknown>>,
  endpointFns: Array<(id: number) => string>,
  onProgress: (done: number, total: number) => void,
  concurrency = 15,
): Promise<Record<string, unknown>[]> {
  const client = getApiClient()
  const results: Record<string, unknown>[] = new Array(records.length)
  let cursor = 0
  let done = 0

  async function work(): Promise<void> {
    while (cursor < records.length) {
      const i = cursor++
      const record = records[i]
      const enrichments = await Promise.all(
        endpointFns.map(fn =>
          client.get(fn(record.id as number))
            .then(r => r.data as Record<string, unknown>)
            .catch(() => ({} as Record<string, unknown>)),
        ),
      )
      results[i] = Object.assign({}, record, ...enrichments)
      onProgress(++done, records.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, records.length) }, work))
  return results
}

export async function enrichSchueler(
  students: SchuelerAuswahl[],
  endpointFns: Array<(id: number) => string>,
  onProgress: (done: number, total: number) => void,
  concurrency = 15,
): Promise<Record<string, unknown>[]> {
  return enrichRecords(students as Array<Record<string, unknown>>, endpointFns, onProgress, concurrency)
}

export async function fetchSchuelerAuswahlliste(abschnittId: number): Promise<SchuelerAuswahl[]> {
  const response = await getApiClient().get(`/schueler/abschnitt/${abschnittId}/auswahlliste`, {
    params: { _t: Date.now() },
  })
  const raw = response.data

  // Response is { schueler: [...], klassen: [...], ... }, not a plain array
  const schueler: SchuelerAuswahl[] = Array.isArray(raw?.schueler) ? raw.schueler : (Array.isArray(raw) ? raw : [])

  const klassenMap = new Map<number, string>()
  if (Array.isArray(raw?.klassen)) {
    for (const k of raw.klassen as { id: number; kuerzel: string }[]) {
      if (k.id && k.kuerzel) klassenMap.set(k.id, k.kuerzel)
    }
  }

  return schueler.map(s => ({
    ...s,
    klasse: klassenMap.get(s.idKlasse as number) ?? (s.idKlasse != null ? String(s.idKlasse) : ''),
  }))
}

export async function fetchLernabschnittId(
  schuelerId: number,
  idSchuljahresabschnitt: number,
): Promise<number | null> {
  const resp = await getApiClient().get<SchuelerLernabschnitt[]>(
    `/schueler/lernabschnittsdaten/${schuelerId}/${idSchuljahresabschnitt}`,
  )
  const la = resp.data.find(l => l.wechselNr === 0) ?? resp.data[0]
  return la?.id ?? null
}

export interface LeistungsdatenCreatePayload {
  lernabschnittID: number
  fachID: number
  kursart: string           // Kursart-Kürzel, z.B. "PUK", "GK", "LK"
  lehrerID: number | null
  wochenstunden: number | null
  aufZeugnis: boolean
}

export async function createLeistungsdaten(
  payload: LeistungsdatenCreatePayload,
): Promise<UploadResult> {
  try {
    // Null-Felder nicht mitsenden — Server lehnt unbekannte/leere optionale Felder ab
    const body: Record<string, unknown> = {
      lernabschnittID: payload.lernabschnittID,
      fachID: payload.fachID,
      kursart: payload.kursart,
      aufZeugnis: payload.aufZeugnis,
    }
    if (payload.lehrerID !== null) body.lehrerID = payload.lehrerID
    if (payload.wochenstunden !== null) body.wochenstunden = payload.wochenstunden

    const resp = await getApiClient().post('/schueler/leistungsdaten/create', body)
    return { success: true, id: resp.data?.id }
  } catch (error) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export interface KursCreatePayload {
  idSchuljahresabschnitt: number
  kuerzel: string
  idJahrgaenge: number[]
  idFach: number
  lehrer: number | null
  kursartAllg: string
  sortierung: number
  istSichtbar: boolean
  schienen: number[]
  wochenstunden: number
  wochenstundenLehrer: number
  idKursFortschreibungsart: number
  schulnummer: number | null
  istEpochalunterricht: boolean
  bezeichnungZeugnis: string
}

export async function createKurs(payload: KursCreatePayload): Promise<UploadResult> {
  try {
    const response = await getApiClient().post('/kurse/create', payload)
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export interface DbKursEintrag {
  id: number
  kuerzel: string
  idFach: number | null
  kursartAllg: string
  idJahrgaenge: number[]
  lehrer: number | null
  wochenstunden?: number
  schueler?: Array<{ id: number }>
}

export interface LeistungsdatenEintrag {
  id: number
  fachID: number
  kursID?: number | null
}

export async function fetchLeistungsdatenFuerLernabschnitt(
  lernabschnittId: number,
): Promise<LeistungsdatenEintrag[]> {
  try {
    const response = await getApiClient().get(
      `/schueler/lernabschnittsdaten/${lernabschnittId}`,
      { params: { _t: Date.now() } },
    )
    const data = response.data as { leistungsdaten?: LeistungsdatenEintrag[] }
    return Array.isArray(data?.leistungsdaten) ? data.leistungsdaten : []
  } catch {
    return []
  }
}

export async function deleteSchuelerLeistungsdaten(id: number): Promise<UploadResult> {
  try {
    await getApiClient().delete(`/schueler/leistungsdaten/delete/multiple`, { data: [id] })
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function createSchuelerLeistungsdaten(
  lernabschnittID: number,
  fachID: number,
): Promise<UploadResult> {
  try {
    const response = await getApiClient().post('/schueler/leistungsdaten/create', { lernabschnittID, fachID })
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function patchSchuelerLeistungsdaten(
  id: number,
  patch: Record<string, unknown>,
): Promise<UploadResult> {
  try {
    await getApiClient().patch(`/schueler/leistungsdaten/${id}`, patch)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export async function fetchKurseFuerAbschnitt(abschnittId: number): Promise<DbKursEintrag[]> {
  const response = await getApiClient().get(`/kurse/abschnitt/${abschnittId}`, {
    params: { _t: Date.now() },
  })
  return Array.isArray(response.data) ? response.data : []
}

export interface SchuelerListeEintrag {
  id: number
  nachname: string
  vorname: string
  geburtsdatum?: string | null
  status?: number
}

export async function fetchSchuelerAktuell(): Promise<SchuelerListeEintrag[]> {
  try {
    const response = await getApiClient().get<SchuelerListeEintrag[]>('/schueler/aktuell')
    return Array.isArray(response.data) ? response.data : []
  } catch {
    return []
  }
}

export async function fetchSchuelerSchulbesuch(id: number): Promise<Record<string, unknown> | null> {
  try {
    const response = await getApiClient().get<Record<string, unknown>>(`/schueler/${id}/schulbesuch`)
    return response.data ?? null
  } catch {
    return null
  }
}

export async function patchSchuelerSchulbesuch(
  id: number,
  patch: Record<string, unknown>,
): Promise<UploadResult> {
  try {
    await getApiClient().patch(`/schueler/${id}/schulbesuch`, patch)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: toAppError(error).messageUser }
  }
}

export interface SchulEintrag {
  id: number
  kuerzel?: string | null
  kurzbezeichnung?: string | null
  schulnummerStatistik?: string | null
  name: string
  idSchulform?: number | null
  strassenname?: string | null
  hausnummer?: string | null
  zusatzHausnummer?: string | null
  plz?: string | null
  ort?: string | null
  telefon?: string | null
  fax?: string | null
  email?: string | null
  schulleiter?: string | null
  sortierung: number
  istSichtbar: boolean
}

/** Eintrag aus dem allgemeinen NRW-Schulverzeichnis (GET /schule/allgemein/schulen) */
export interface SchulenKatalogEintrag {
  SchulNr: string
  ABez1?: string
  ABez2?: string
  ABez3?: string
  KurzBez?: string
  SF?: string
  Strasse?: string
  PLZ?: string
  Ort?: string
  TelVorw?: string
  Telefon?: string
  FaxVorw?: string
  Fax?: string
  Email?: string
}

export interface KatalogEntlassgrund {
  id: number
  bezeichnung: string
  sortierung?: number
  istSichtbar?: boolean
}

export async function fetchEntlassgruende(): Promise<Set<number>> {
  try {
    const response = await getApiClient().get<KatalogEntlassgrund[]>('/entlassgruende')
    const set = new Set<number>()
    for (const e of response.data) if (e.id) set.add(e.id)
    return set
  } catch {
    return new Set()
  }
}

export async function fetchSchulKatalog(): Promise<SchulEintrag[]> {
  try {
    const response = await getApiClient().get<SchulEintrag[]>('/schule/schulen')
    return Array.isArray(response.data) ? response.data : []
  } catch {
    return []
  }
}

export async function fetchAllgemeineSchulen(): Promise<SchulenKatalogEintrag[]> {
  try {
    const response = await getApiClient().get<SchulenKatalogEintrag[]>('/schule/allgemein/schulen')
    return Array.isArray(response.data) ? response.data : []
  } catch {
    return []
  }
}

function splitStrasse(strasse: string): { name: string; nr: string; zusatz: string } {
  const match = strasse.trim().match(/^(.*?)\s+(\d+\w*)(\s+\S+)?$/)
  if (!match) return { name: strasse.trim(), nr: '', zusatz: '' }
  return { name: match[1].trim(), nr: match[2].trim(), zusatz: match[3]?.trim() ?? '' }
}

export function schulenKatalogToSchulEintrag(
  sk: SchulenKatalogEintrag,
  schulformenMap: Map<string, number>,
): Omit<SchulEintrag, 'id'> {
  const idSchulform = sk.SF ? (schulformenMap.get(sk.SF.trim()) ?? null) : null
  const strasse = splitStrasse(sk.Strasse ?? '')
  const name = [sk.ABez1, sk.ABez2, sk.ABez3].filter(Boolean).join(' ') || `Schule ${sk.SchulNr}`
  return {
    schulnummerStatistik: sk.SchulNr,
    kuerzel: null,
    kurzbezeichnung: sk.KurzBez ?? null,
    name,
    idSchulform,
    strassenname: strasse.name || null,
    hausnummer: strasse.nr || null,
    zusatzHausnummer: strasse.zusatz || null,
    plz: sk.PLZ ?? null,
    ort: sk.Ort ?? null,
    telefon: sk.Telefon ?? null,
    fax: sk.Fax ?? null,
    email: sk.Email ?? null,
    schulleiter: null,
    sortierung: 32000,
    istSichtbar: true,
  }
}

export interface KindergartenEintrag {
  id: number
  bezeichnung: string
}

export async function fetchKindergaerten(): Promise<KindergartenEintrag[]> {
  try {
    const resp = await getApiClient().get<KindergartenEintrag[]>('/kindergaerten')
    return resp.data
  } catch {
    return []
  }
}

export async function createKindergarten(bezeichnung: string): Promise<{ id: number } | { error: string }> {
  try {
    const resp = await getApiClient().post<KindergartenEintrag>('/kindergarten/create', {
      bezeichnung,
      bemerkung: null,
      tel: null,
      email: null,
      strassenname: null,
      hausNr: null,
      hausNrZusatz: null,
      plz: null,
      ort: null,
      sortierung: 32000,
      istSichtbar: true,
    })
    return { id: resp.data.id }
  } catch (error: unknown) {
    return { error: toAppError(error).messageUser }
  }
}

export async function createSchuleInKatalog(
  schulnummer: string,
  vollDaten?: Omit<SchulEintrag, 'id'>,
): Promise<{ id: number } | { error: string }> {
  try {
    const body = vollDaten ?? {
      name: `Schule ${schulnummer}`,
      schulnummerStatistik: schulnummer,
      sortierung: 32000,
      istSichtbar: true,
    }
    const response = await getApiClient().post<SchulEintrag | number>('/schule/schulen/create', body)
    const id = typeof response.data === 'number'
      ? response.data
      : (response.data as SchulEintrag).id
    if (!id) throw new Error(`Schule angelegt, aber keine gültige ID in der Antwort: ${JSON.stringify(response.data)}`)
    return { id }
  } catch (error: unknown) {
    return { error: toAppError(error).messageUser }
  }
}

