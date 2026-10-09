import { getApiClient, getRootClient } from './apiClient'
import type { ImportKataloge, OrtKatalogEintrag, ReligionKatalogEintrag } from '@/models/ImportSchema'
import type { JahrgangAsdKataloge } from '@/models/Jahrgaenge'

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
  bezeichnung?: string
  staatsangehoerigkeit?: string
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

// Gibt die numerische Katalog-ID zurück (für idStaatsangehoerigkeit, idGeburtsland usw.)
function parseNationalitaetenById(katalog: AllinoneKatalog): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of katalog.daten) {
    const h = currentHistorie(entry)
    if (!h?.id) continue
    if (h.schluessel) map.set(h.schluessel, h.id)
    if (h.codeDEStatis) map.set(h.codeDEStatis, h.id)
    if (h.iso3) {
      map.set(h.iso3, h.id)
      map.set(h.iso3.toLowerCase(), h.id)
    }
    if (h.kuerzel) {
      map.set(h.kuerzel, h.id)
      map.set(h.kuerzel.toLowerCase(), h.id)
    }
    if (h.text) map.set(h.text.trim().toLowerCase(), h.id)
    // Ländername ("Deutschland") und Adjektiv ("deutsch") als Freitext-Lookup
    if (h.bezeichnung) map.set(h.bezeichnung.trim().toLowerCase(), h.id)
    if (h.staatsangehoerigkeit) map.set(h.staatsangehoerigkeit.trim().toLowerCase(), h.id)
  }
  return map
}

export function resolveNationalitaetId(
  nationalitaetenById: Map<string, number> | undefined,
  raw: string,
): number | null {
  if (!raw || !nationalitaetenById) return null
  const trimmed = raw.trim()
  return nationalitaetenById.get(trimmed)
    ?? nationalitaetenById.get(trimmed.toLowerCase())
    ?? null
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

/** Eintrag aus /schule/religionen — seit SVWS 1.5 ohne kuerzel, stattdessen idReligion (Statistik-Katalog) */
interface ReligionApiEintrag {
  id: number
  bezeichnung: string | null
  idReligion?: number | null
  kuerzel?: string | null
}

async function fetchReligionenRaw(): Promise<ReligionApiEintrag[]> {
  // Eigener Endpunkt nötig: allinone.json liefert Typ-Katalog-IDs (1000, 2000…),
  // der Server erwartet aber die echten DB-IDs als Fremdschlüssel.
  const resp = await getApiClient().get<ReligionApiEintrag[]>('/schule/religionen')
  return resp.data
}

/**
 * Ergänzt die Schul-Religionen um das Statistik-Kürzel (KR, ER, …),
 * indem idReligion gegen den Religion-Katalog aus allinone.json aufgelöst wird.
 */
function withReligionKuerzel(
  entries: ReligionApiEintrag[],
  katalog: AllinoneKatalog | undefined,
): ReligionKatalogEintrag[] {
  const kuerzelById = new Map<number, string>()
  for (const entry of katalog?.daten ?? []) {
    for (const h of entry.historie) {
      if (h.id && h.kuerzel) kuerzelById.set(h.id, h.kuerzel)
    }
  }
  return entries.map(e => ({
    id: e.id,
    bezeichnung: e.bezeichnung,
    // Fallback auf kuerzel für ältere Server-Versionen
    kuerzel: (e.idReligion != null ? kuerzelById.get(e.idReligion) : undefined) ?? e.kuerzel ?? null,
  }))
}

export async function fetchSchulReligionen(): Promise<ReligionKatalogEintrag[]> {
  const [entries, allinone] = await Promise.all([fetchReligionenRaw(), fetchAllInOne()])
  return withReligionKuerzel(entries, allinone.Religion)
}

function buildReligionMap(entries: ReligionKatalogEintrag[]): Map<string, ReligionKatalogEintrag> {
  const map = new Map<string, ReligionKatalogEintrag>()
  for (const entry of entries) {
    // Einträge ohne Kürzel trotzdem aufnehmen, damit der Bezeichnungs-Match (Stufe 2) sie findet
    const key = entry.kuerzel ? entry.kuerzel.toUpperCase() : `#${entry.id}`
    if (!map.has(key)) map.set(key, entry)
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

function parseVerkehrssprachenById(katalog: AllinoneKatalog): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of katalog.daten) {
    const h = currentHistorie(entry)
    if (!h?.id) continue
    if (h.text) map.set(h.text.trim().toLowerCase(), h.id)
    if (h.kuerzel) map.set(h.kuerzel.trim().toLowerCase(), h.id)
    // iso3 als zusätzlicher Lookup (3-Buchstaben-Code, z.B. "deu")
    if (h.iso3) map.set(h.iso3.trim().toLowerCase(), h.id)
  }
  return map
}

/**
 * Löst einen Freitext-Sprachname (z.B. "Polnisch") oder ein Kürzel/ISO-Code
 * gegen den Verkehrssprachen-Katalog auf und gibt die numerische Katalog-ID zurück.
 */
export function resolveVerkehrsspracheId(
  verkehrssprachenById: Map<string, number> | undefined,
  raw: string,
): number | null {
  if (!raw || !verkehrssprachenById) return null
  return verkehrssprachenById.get(raw.trim().toLowerCase()) ?? null
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

// ── ASD-Jahrgänge + Schulgliederungen (für den Jahrgangsimport) ──────────────

let asdKatalogePromise: Promise<JahrgangAsdKataloge> | null = null

/** Kürzel → CoreType-ID für Jahrgaenge und Schulgliederung (jeweils aktueller Historien-Eintrag), gecacht */
export function fetchJahrgangAsdKataloge(): Promise<JahrgangAsdKataloge> {
  if (!asdKatalogePromise) {
    // Bei Fehler Cache verwerfen, damit der nächste Aufruf erneut lädt
    asdKatalogePromise = loadJahrgangAsdKataloge().catch((e) => { asdKatalogePromise = null; throw e })
  }
  return asdKatalogePromise
}

async function loadJahrgangAsdKataloge(): Promise<JahrgangAsdKataloge> {
  const data = await fetchAllInOne()
  const toMap = (katalog: AllinoneKatalog | undefined): Map<string, number> => {
    const map = new Map<string, number>()
    for (const entry of (katalog?.daten ?? [])) {
      const h = currentHistorie(entry)
      // id 0 ist gültig (z.B. Schulgliederung "***")
      if (h?.kuerzel && typeof h.id === 'number') map.set(h.kuerzel.trim(), h.id)
    }
    return map
  }
  return { jahrgaenge: toMap(data['Jahrgaenge']), schulgliederungen: toMap(data['Schulgliederung']) }
}

// ── Schulform + Jahrgänge (aus allinone.json, ein einziger Fetch) ─────────────

export interface JahrgangKatalogEintrag {
  kuerzel: string
  text: string
  schulformen: string[]
}

export interface AllinoneSchulenKataloge {
  /** schluessel|kuerzel → DB-ID (für schulenKatalogToSchulEintrag) */
  schulformenMap: Map<string, number>
  /** SF-Schlüssel (z.B. "02") → Schulform-Kürzel (z.B. "G") */
  schulformKuerzelMap: Map<string, string>
  /** Jahrgang-Kürzel (z.B. "04") → Katalog-Eintrag inkl. gültiger Schulformen */
  jahrgaengeMap: Map<string, JahrgangKatalogEintrag>
  /** Gültige Schlüssel aus SchulabschlussAllgemeinbildend (z.B. "G", "K", "A") */
  schulabschlussAllgemeinbildendSet: Set<string>
  /** Gültige Schlüssel aus SchulabschlussBerufsbildend (einstellige Ziffern, z.B. "1", "2") */
  schulabschlussBerufsbildendSet: Set<string>
  /** Kürzel → DB-ID aus Uebergangsempfehlung */
  uebergangsempfehlungMap: Map<string, number>
}

export async function fetchAllinoneSchulenKataloge(): Promise<AllinoneSchulenKataloge> {
  const schulformenMap    = new Map<string, number>()
  const schulformKuerzelMap = new Map<string, string>()
  const jahrgaengeMap     = new Map<string, JahrgangKatalogEintrag>()
  const schulabschlussAllgemeinbildendSet = new Set<string>()
  const schulabschlussBerufsbildendSet    = new Set<string>()
  const uebergangsempfehlungMap = new Map<string, number>()
  try {
    const data = await fetchAllInOne()
    const raw  = data as Record<string, { version: number; daten: { bezeichner: string; idStatistik: string; historie: (AllinoneHistorie & { schulformen?: string[] })[] }[] } | undefined>

    // Schulformen
    for (const entry of (raw['Schulform']?.daten ?? [])) {
      const h = entry.historie.find(x => x.gueltigBis === null) ?? entry.historie[entry.historie.length - 1]
      if (!h) continue
      if (h.id)       { if (h.schluessel) schulformenMap.set(h.schluessel.trim(), h.id); if (h.kuerzel) schulformenMap.set(h.kuerzel.trim(), h.id) }
      if (h.schluessel && h.kuerzel) schulformKuerzelMap.set(h.schluessel.trim(), h.kuerzel.trim())
    }

    // Jahrgänge
    for (const entry of (raw['Jahrgaenge']?.daten ?? [])) {
      const h = entry.historie.find(x => x.gueltigBis === null) ?? entry.historie[entry.historie.length - 1]
      if (!h?.kuerzel) continue
      jahrgaengeMap.set(h.kuerzel.trim(), { kuerzel: h.kuerzel.trim(), text: h.text, schulformen: h.schulformen ?? [] })
    }

    // SchulabschlussAllgemeinbildend
    for (const entry of (raw['SchulabschlussAllgemeinbildend']?.daten ?? [])) {
      const h = entry.historie.find(x => x.gueltigBis === null) ?? entry.historie[entry.historie.length - 1]
      if (h?.schluessel) schulabschlussAllgemeinbildendSet.add(h.schluessel.trim())
    }

    // SchulabschlussBerufsbildend (einstellige Ziffern)
    for (const entry of (raw['SchulabschlussBerufsbildend']?.daten ?? [])) {
      const h = entry.historie.find(x => x.gueltigBis === null) ?? entry.historie[entry.historie.length - 1]
      if (h?.schluessel) schulabschlussBerufsbildendSet.add(h.schluessel.trim())
    }

    // Uebergangsempfehlung: kürzel → id
    for (const entry of (raw['Uebergangsempfehlung']?.daten ?? [])) {
      const h = entry.historie.find(x => x.gueltigBis === null) ?? entry.historie[entry.historie.length - 1]
      if (h?.kuerzel && h.id) uebergangsempfehlungMap.set(h.kuerzel.trim(), h.id)
    }
  } catch { /* Katalog nicht verfügbar → leere Strukturen */ }
  return { schulformenMap, schulformKuerzelMap, jahrgaengeMap, schulabschlussAllgemeinbildendSet, schulabschlussBerufsbildendSet, uebergangsempfehlungMap }
}

/** @deprecated Nutze fetchAllinoneSchulenKataloge() */
export async function fetchSchulformenMap(): Promise<Map<string, number>> {
  return (await fetchAllinoneSchulenKataloge()).schulformenMap
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
    fetchReligionenRaw(),
    fetchOrte(),
  ])

  const allinone = allinoneResult.status === 'fulfilled' ? allinoneResult.value : undefined
  if (allinone?.Nationalitaeten) kataloge.nationalitaetenById  = parseNationalitaetenById(allinone.Nationalitaeten)
  if (allinone?.Verkehrssprache) kataloge.verkehrssprachenById = parseVerkehrssprachenById(allinone.Verkehrssprache)
  if (religionenResult.status === 'fulfilled') {
    kataloge.religionen = buildReligionMap(withReligionKuerzel(religionenResult.value, allinone?.Religion))
  }
  if (orteResult.status === 'fulfilled')       kataloge.orte       = orteResult.value

  return kataloge
}
