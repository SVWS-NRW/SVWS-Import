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
import type { ImportModule, MappedRow, ImportContext, EntityType, OrtKatalogEintrag } from '@/models/ImportSchema'
import { resolveWohnortId, resolveReligionId } from './katalogService'

export interface UploadResult {
  success: boolean
  id?: number
  error?: string
}

interface SchuelerLernabschnitt {
  id: number
  wechselNr: number
  klassenID: number | null
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
): Promise<UploadResult> {
  try {
    const payload: SchuelerNeu = schuelerImportToApi(row, idSchuljahresabschnitt)
    const response = await getApiClient().post('/schueler/create', payload)
    const newId: number = response.data.id

    // ── Stammdaten-Patch (Adresse, Kontakt, Religion) ────────────────────────
    const stammdatenPatch: Record<string, unknown> = {}
    if (row.geburtsname)   stammdatenPatch.geburtsname  = row.geburtsname
    if (row.geburtsort)    stammdatenPatch.geburtsort    = row.geburtsort
    if (row.strassenname)  stammdatenPatch.strassenname  = row.strassenname
    if (row.hausnummer)    stammdatenPatch.hausnummer    = row.hausnummer
    if (row.telefon)       stammdatenPatch.telefon       = row.telefon
    if (row.email)         stammdatenPatch.emailPrivat   = row.email

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

export async function createLehrer(row: LehrerImportRow): Promise<UploadResult> {
  try {
    const payload: LehrerStammdaten = lehrerImportToApi(row)
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

export async function fetchOrteById(): Promise<Map<number, OrtKatalogEintrag>> {
  const response = await getApiClient().get<OrtKatalogEintrag[]>('/orte')
  const map = new Map<number, OrtKatalogEintrag>()
  for (const entry of response.data) {
    if (entry.id) map.set(entry.id, entry)
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
  const response = await getApiClient().get(`/schueler/abschnitt/${abschnittId}/auswahlliste`)
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

