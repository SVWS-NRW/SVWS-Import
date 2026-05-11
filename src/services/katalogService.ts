import { getApiClient } from './apiClient'
import type { ImportKataloge, OrtKatalogEintrag } from '@/models/ImportSchema'

interface SvwsNationalitaet {
  kuerzel: string
  schluessel: string
}

async function fetchNationalitaeten(): Promise<Map<string, string>> {
  const resp = await getApiClient().get<SvwsNationalitaet[]>('/schule/allgemein/nationalitaeten')
  const map = new Map<string, string>()
  for (const entry of resp.data) {
    if (entry.schluessel && entry.kuerzel) {
      map.set(entry.schluessel, entry.kuerzel)
    }
  }
  return map
}

async function fetchOrte(): Promise<Map<string, OrtKatalogEintrag>> {
  const resp = await getApiClient().get<OrtKatalogEintrag[]>('/orte')
  const map = new Map<string, OrtKatalogEintrag>()
  for (const entry of resp.data) {
    if (entry.plz && entry.ortsname) {
      const key = `${entry.plz.trim()}|${entry.ortsname.trim().toLowerCase()}`
      map.set(key, entry)
    }
  }
  return map
}

export function resolveWohnortId(
  orte: Map<string, OrtKatalogEintrag>,
  plz: string,
  ortsname: string,
): number | null {
  if (!plz && !ortsname) return null
  const key = `${plz.trim()}|${ortsname.trim().toLowerCase()}`
  return orte.get(key)?.id ?? null
}

export async function loadKataloge(): Promise<ImportKataloge> {
  const kataloge: ImportKataloge = {}
  const results = await Promise.allSettled([
    fetchNationalitaeten(),
    fetchOrte(),
  ])
  if (results[0].status === 'fulfilled') {
    kataloge.nationalitaeten = results[0].value
  }
  if (results[1].status === 'fulfilled') {
    kataloge.orte = results[1].value
  }
  return kataloge
}
