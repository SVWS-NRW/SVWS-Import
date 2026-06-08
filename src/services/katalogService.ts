import { getApiClient, getRootClient } from './apiClient'
import type { ImportKataloge, OrtKatalogEintrag, ReligionKatalogEintrag } from '@/models/ImportSchema'

// ── allinone.json types ──────────────────────────────────────────────────────

interface AllinoneHistorie {
  id: number
  schluessel: string
  kuerzel: string
  text: string
  gueltigVon: number | null
  gueltigBis: number | null
  iso3?: string
  codeDEStatis?: string
}

interface KursartHistorie {
  id: number
  kuerzel: string
  schluessel: string
  text: string
  gueltigVon: number | null
  gueltigBis: number | null
  zulaessig: { schulform: string; gliederung: string | null }[]
  erlaubtGOSt?: boolean
}

interface KursartEintrag {
  bezeichner: string
  idStatistik: string
  historie: KursartHistorie[]
}

interface AllinoneEintrag {
  bezeichner: string
  idStatistik: string
  historie: AllinoneHistorie[]
}

interface AllinoneKatalog {
  version: number
  daten: AllinoneEintrag[]
}

interface AllinoneResponse {
  Nationalitaeten?: AllinoneKatalog
  Religion?: AllinoneKatalog
  Verkehrssprache?: AllinoneKatalog
  [key: string]: AllinoneKatalog | undefined
}

function currentHistorie(entry: AllinoneEintrag): AllinoneHistorie | undefined {
  return entry.historie.find(h => h.gueltigBis === null) ?? entry.historie[entry.historie.length - 1]
}

async function fetchAllInOne(): Promise<AllinoneResponse> {
  const resp = await getRootClient().get<AllinoneResponse>('/types/allinone.json')
  return resp.data
}

// ── Nationalitaeten ──────────────────────────────────────────────────────────

function parseNationalitaeten(katalog: AllinoneKatalog): Map<string, string> {
  const map = new Map<string, string>()
  for (const entry of katalog.daten) {
    const h = currentHistorie(entry)
    if (!h) continue
    if (h.schluessel && h.kuerzel) {
      map.set(h.schluessel, h.kuerzel)
    }
    // codeDEStatis → iso3 zuletzt, damit Schild-NRW-Codes (.dat) immer gewinnen
    if (h.codeDEStatis && h.iso3) {
      map.set(h.codeDEStatis, h.iso3)
    }
  }
  return map
}

export function resolveNationalitaet(
  nationalitaeten: Map<string, string> | undefined,
  raw: string,
): string {
  if (!raw || !nationalitaeten) return raw
  return nationalitaeten.get(raw) ?? raw
}

// ── Religionen ────────────────────────────────────────────────────────────────

/**
 * Bekannte Textvarianten aus Schild-NRW → Katalog-Kürzel.
 * Deckt Schreibweisen, Kurzformen und häufige Tippfehler ab.
 */
const RELIGION_ALIAS: Record<string, string> = {
  // katholisch
  'römisch-katholisch': 'KR', 'roemisch-katholisch': 'KR', 'katholisch': 'KR', 'kath': 'KR', 'kath.': 'KR', 'rk': 'KR',
  // evangelisch
  'evangelisch': 'ER', 'evangelisch freikirchlich': 'ER', 'ev': 'ER', 'ev.': 'ER', 'evang': 'ER',
  // evangelisch freikirchlich (Schild-NRW-Kürzel)
  'ev.frk.': 'ER', 'evfrk': 'ER',
  // islamisch / muslimisch
  'islamisch': 'IR', 'isl.': 'IR', 'muslimisch': 'IR', 'muslim': 'IR', 'islam': 'IR',
  // ohne Bekenntnis
  'ohne bekenntnis': 'OH', 'ohne b.': 'OH', 'ohne': 'OH', 'konfessionslos': 'OH', 'atheistisch': 'OH',
  // alevitisch
  'alevitisch': 'AR', 'aleviten': 'AR',
  // jüdisch
  'jüdisch': 'HR', 'juedisch': 'HR', 'jüd': 'HR',
  // griechisch-orthodox
  'griechisch-orthodox': 'OR', 'griechisch orthodox': 'OR', 'gr.orth.': 'OR',
  // syrisch-orthodox (inkl. Tippfehler)
  'syrisch-orthodox': 'SO', 'syrisch orthodox': 'SO', 'syrisch-orthdox': 'SO',
  // sonstige orthodoxe
  'orthodox': 'XO', 'russisch-orthodox': 'XO', 'serbisch-orthodox': 'XO',
  'christlich-orthodox': 'XO', 'bulgarisch-orthodox': 'XO', 'rumänisch-orthodox': 'XO',
  'sonst.orth.': 'XO',
  // andere Religionen (inkl. Schild-NRW-Kürzel)
  'andere religionen': 'XR', 'and.': 'XR', 'sonstige': 'XR',
  'hinduistisch': 'XR', 'buddhistisch': 'XR', 'buddhis.': 'XR', 'buddhist': 'XR', 'sikh': 'XR',
  'zeug.jeh.': 'XR', 'zeugen jehovas': 'XR',
}

async function fetchReligionen(): Promise<Map<string, ReligionKatalogEintrag>> {
  // Eigener Endpunkt nötig: allinone.json liefert Typ-Katalog-IDs (1000, 2000…),
  // der Server erwartet aber die echten DB-IDs als Fremdschlüssel.
  const resp = await getApiClient().get<ReligionKatalogEintrag[]>('/schule/religionen')
  const map = new Map<string, ReligionKatalogEintrag>()
  for (const entry of resp.data) {
    if (entry.kuerzel) map.set(entry.kuerzel.toUpperCase(), entry)
  }
  return map
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

// ── Verkehrssprachen ──────────────────────────────────────────────────────────

function parseVerkehrssprachen(katalog: AllinoneKatalog): Map<string, string> {
  const map = new Map<string, string>()
  for (const entry of katalog.daten) {
    const h = currentHistorie(entry)
    if (!h || !h.kuerzel) continue
    if (h.text) map.set(h.text.trim().toLowerCase(), h.kuerzel)
    map.set(h.kuerzel.trim().toLowerCase(), h.kuerzel)
    // iso3 als zusätzlicher Lookup (3-Buchstaben-Code, z.B. "deu")
    if (h.iso3) map.set(h.iso3.trim().toLowerCase(), h.kuerzel)
  }
  return map
}

/**
 * Löst einen Freitext-Sprachname (z.B. "Polnisch") oder ein Kürzel/ISO-Code
 * gegen den Verkehrssprachen-Katalog auf und gibt das Server-Kürzel zurück.
 */
export function resolveVerkehrssprache(
  verkehrssprachen: Map<string, string> | undefined,
  raw: string,
): string {
  if (!raw || !verkehrssprachen) return raw
  return verkehrssprachen.get(raw.trim().toLowerCase()) ?? raw
}

// ── Orte (separater Endpunkt — nicht in allinone.json) ───────────────────────

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

// ── Schulform ─────────────────────────────────────────────────────────────────

function parseSchulformen(katalog: AllinoneKatalog): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of katalog.daten) {
    const h = currentHistorie(entry)
    if (!h?.id) continue
    // SchulenKatalogEintrag.SF enthält den Statistik-Schlüssel (z.B. "02"), nicht das Kürzel ("G")
    if (h.schluessel) map.set(h.schluessel.trim(), h.id)
    if (h.kuerzel)    map.set(h.kuerzel.trim(), h.id)
  }
  return map
}

/** Lädt das Schulform-Kürzel → DB-ID-Mapping aus allinone.json */
export async function fetchSchulformenMap(): Promise<Map<string, number>> {
  try {
    const data = await fetchAllInOne()
    const katalog = (data as Record<string, AllinoneKatalog | undefined>)['Schulform']
    return katalog ? parseSchulformen(katalog) : new Map()
  } catch {
    return new Map()
  }
}

// ── ZulaessigeKursart ────────────────────────────────────────────────────────

export async function fetchKursartenForSchulform(schulform: string): Promise<Set<string>> {
  const result = new Set<string>()
  try {
    const resp = await fetchAllInOne()
    const katalog = (resp as Record<string, { version: number; daten: KursartEintrag[] } | undefined>)['ZulaessigeKursart']
    if (!katalog?.daten) return result

    for (const eintrag of katalog.daten) {
      const aktiv = eintrag.historie.find(h => h.gueltigBis === null)
      if (!aktiv) continue
      if (aktiv.zulaessig.some(z => z.schulform === schulform))
        result.add(aktiv.kuerzel)
    }
  } catch { /* Katalog nicht verfügbar → keine Einschränkung */ }
  return result
}

// ── Kataloge laden ────────────────────────────────────────────────────────────

export async function loadKataloge(): Promise<ImportKataloge> {
  const kataloge: ImportKataloge = {}
  const [allinoneResult, religionenResult, orteResult] = await Promise.allSettled([
    fetchAllInOne(),
    fetchReligionen(),
    fetchOrte(),
  ])

  if (allinoneResult.status === 'fulfilled') {
    const data = allinoneResult.value
    if (data.Nationalitaeten) kataloge.nationalitaeten  = parseNationalitaeten(data.Nationalitaeten)
    if (data.Verkehrssprache) kataloge.verkehrssprachen = parseVerkehrssprachen(data.Verkehrssprache)
  }
  if (religionenResult.status === 'fulfilled') kataloge.religionen = religionenResult.value
  if (orteResult.status === 'fulfilled')       kataloge.orte       = orteResult.value

  return kataloge
}
