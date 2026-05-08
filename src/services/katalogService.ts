import { getApiClient } from './apiClient'
import type { ImportKataloge } from '@/models/ImportSchema'

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

export async function loadKataloge(): Promise<ImportKataloge> {
  const kataloge: ImportKataloge = {}
  const results = await Promise.allSettled([
    fetchNationalitaeten(),
  ])
  if (results[0].status === 'fulfilled') {
    kataloge.nationalitaeten = results[0].value
  }
  return kataloge
}
