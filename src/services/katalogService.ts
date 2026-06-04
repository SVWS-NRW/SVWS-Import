import { getApiClient } from './apiClient'
import type { ImportKataloge, OrtKatalogEintrag, ReligionKatalogEintrag } from '@/models/ImportSchema'

interface SvwsNationalitaet {
  kuerzel: string
  schluessel: string
  codeDEStatis?: string
  iso3?: string
}

async function fetchNationalitaeten(): Promise<Map<string, string>> {
  const resp = await getApiClient().get<SvwsNationalitaet[]>('/schule/allgemein/nationalitaeten')
  const map = new Map<string, string>()
  for (const entry of resp.data) {
    if (entry.schluessel && entry.kuerzel) {
      map.set(entry.schluessel, entry.kuerzel)
    }
    // codeDEStatis → iso3 zuletzt, damit Schild-NRW-Codes (.dat) immer gewinnen
    if (entry.codeDEStatis && entry.iso3) {
      map.set(entry.codeDEStatis, entry.iso3)
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

export async function fetchOrteKatalog(): Promise<Map<string, OrtKatalogEintrag>> {
  return fetchOrte()
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

// ── Religionen ────────────────────────────────────────────────────────────────

async function fetchReligionen(): Promise<Map<string, ReligionKatalogEintrag>> {
  const resp = await getApiClient().get<ReligionKatalogEintrag[]>('/schule/religionen')
  const map = new Map<string, ReligionKatalogEintrag>()
  for (const entry of resp.data) {
    if (entry.kuerzel) map.set(entry.kuerzel.toUpperCase(), entry)
  }
  return map
}

/**
 * Bekannte Textvarianten aus Schild-NRW → Katalog-Kürzel.
 * Deckt Schreibweisen, Kurzformen und häufige Tippfehler ab.
 */
const RELIGION_ALIAS: Record<string, string> = {
  // katholisch
  'römisch-katholisch': 'KR', 'roemisch-katholisch': 'KR', 'katholisch': 'KR', 'kath': 'KR', 'rk': 'KR',
  // evangelisch
  'evangelisch': 'ER', 'evangelisch freikirchlich': 'ER', 'ev': 'ER', 'evang': 'ER',
  // islamisch / muslimisch
  'islamisch': 'IR', 'muslimisch': 'IR', 'muslim': 'IR', 'islam': 'IR',
  // ohne Bekenntnis
  'ohne bekenntnis': 'OH', 'ohne': 'OH', 'konfessionslos': 'OH', 'atheistisch': 'OH',
  // alevitisch
  'alevitisch': 'AR', 'aleviten': 'AR',
  // jüdisch
  'jüdisch': 'HR', 'juedisch': 'HR', 'jüd': 'HR',
  // griechisch-orthodox
  'griechisch-orthodox': 'OR', 'griechisch orthodox': 'OR',
  // syrisch-orthodox (inkl. Tippfehler)
  'syrisch-orthodox': 'SO', 'syrisch orthodox': 'SO', 'syrisch-orthdox': 'SO',
  // sonstige orthodoxe
  'orthodox': 'XO', 'russisch-orthodox': 'XO', 'serbisch-orthodox': 'XO',
  'christlich-orthodox': 'XO', 'bulgarisch-orthodox': 'XO', 'rumänisch-orthodox': 'XO',
  // andere Religionen
  'andere religionen': 'XR', 'sonstige': 'XR', 'hinduistisch': 'XR', 'buddhistisch': 'XR',
  'buddhis.': 'XR', 'buddhist': 'XR', 'sikh': 'XR',
}

/**
 * Dreistufiges Matching:
 * 1. Direktes Kürzel-Lookup (StatistikKrz aus Schild-NRW, zuverlässigster Weg)
 * 2. Normalisierter Bezeichnungs-Vergleich gegen Katalog-Einträge
 * 3. Alias-Tabelle für bekannte Varianten und Tippfehler
 */
export function resolveReligionId(
  religionen: Map<string, ReligionKatalogEintrag>,
  kuerzel: string,
  text: string,
): number | null {
  // Stufe 1: Kürzel-Match (Schild-NRW StatistikKrz Konfession)
  if (kuerzel) {
    const byKuerzel = religionen.get(kuerzel.trim().toUpperCase())
    if (byKuerzel) return byKuerzel.id
  }

  if (!text) return null
  const normalized = text.trim().toLowerCase()

  // Stufe 2: Bezeichnungs-Match gegen Katalog
  for (const entry of religionen.values()) {
    if (entry.bezeichnung?.toLowerCase() === normalized) return entry.id
  }

  // Stufe 3: Alias-Tabelle
  const aliasKuerzel = RELIGION_ALIAS[normalized]
  if (aliasKuerzel) {
    const byAlias = religionen.get(aliasKuerzel)
    if (byAlias) return byAlias.id
  }

  return null
}

export function resolveNationalitaet(
  nationalitaeten: Map<string, string> | undefined,
  raw: string,
): string {
  if (!raw || !nationalitaeten) return raw
  return nationalitaeten.get(raw) ?? raw
}

export async function loadKataloge(): Promise<ImportKataloge> {
  const kataloge: ImportKataloge = {}
  const results = await Promise.allSettled([
    fetchNationalitaeten(),
    fetchOrte(),
    fetchReligionen(),
  ])
  if (results[0].status === 'fulfilled') kataloge.nationalitaeten = results[0].value
  if (results[1].status === 'fulfilled') kataloge.orte            = results[1].value
  if (results[2].status === 'fulfilled') kataloge.religionen      = results[2].value
  return kataloge
}
