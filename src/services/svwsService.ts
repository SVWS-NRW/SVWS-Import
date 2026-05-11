import { getApiClient } from './apiClient'
import type { SchuelerNeu, SchuelerImportRow } from '@/models/Schueler'
import type { LehrerStammdaten, LehrerImportRow } from '@/models/Lehrer'
import type { KlasseImportRow, KlasseDetails } from '@/models/Klassen'
import type { JahrgangImportRow, JahrgangDetails } from '@/models/Jahrgaenge'
import type { SchuleStammdaten } from '@/models/Schule'
import { schuelerImportToApi } from '@/models/Schueler'
import { lehrerImportToApi } from '@/models/Lehrer'
import { klasseImportToApi } from '@/models/Klassen'
import { jahrgangImportToApi } from '@/models/Jahrgaenge'
import type { ImportModule, MappedRow, ImportContext, EntityType } from '@/models/ImportSchema'
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
    return { success: true, id: response.data?.id }
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) }
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
    return { success: false, error: extractErrorMessage(error) }
  }
}

export async function createLehrer(row: LehrerImportRow): Promise<UploadResult> {
  try {
    const payload: LehrerStammdaten = lehrerImportToApi(row)
    const response = await getApiClient().post('/lehrer/create', payload)
    return { success: true, id: response.data.id }
  } catch (error: unknown) {
    return { success: false, error: extractErrorMessage(error) }
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
    return { success: false, error: extractErrorMessage(error) }
  }
}

export async function fetchSchuleStammdaten(): Promise<SchuleStammdaten> {
  const response = await getApiClient().get('/schule/stammdaten')
  return response.data
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
    return { success: false, error: extractErrorMessage(error) }
  }
}

export async function fetchForExport(endpoint: string): Promise<Record<string, unknown>[]> {
  const response = await getApiClient().get(endpoint)
  return Array.isArray(response.data) ? response.data : []
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status: number; data?: unknown } }
    const status = axiosError.response?.status
    const data = axiosError.response?.data
    if (status === 401) return 'Nicht autorisiert – Zugangsdaten prüfen'
    if (status === 409) return 'Datensatz existiert bereits'
    if (data && typeof data === 'string') return data
    if (data && typeof data === 'object') return JSON.stringify(data)
    return `HTTP ${status}`
  }
  if (error instanceof Error) return error.message
  return 'Unbekannter Fehler'
}
