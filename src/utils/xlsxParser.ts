import readXlsxFile from 'read-excel-file/browser'
import { type SchuelerImportRow } from '@/models/Schueler'
import { type LehrerImportRow } from '@/models/Lehrer'
import { type FloskelImportRow } from '@/models/Floskel'
import { generateId } from './idHelper'
import { normalisiereDatum } from './csvParser'

type CellValue = string | number | boolean | Date | null
type SheetObject = { sheet: string; data: CellValue[][] }

/** Gleicht beide Rückgabeformate von readXlsxFile aus (flat CellValue[][] vs. [{sheet,data}][]) */
function extractRows(raw: unknown): CellValue[][] {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const first = raw[0]
  if (!Array.isArray(first) && first !== null && typeof first === 'object' && 'data' in first) {
    return (first as SheetObject).data
  }
  return raw as CellValue[][]
}

function normalize(val: CellValue): string {
  if (val === null || val === undefined) return ''
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).trim()
}

function buildHeaderMap(header: CellValue[]): Map<string, number> {
  const map = new Map<string, number>()
  header.forEach((cell, i) => {
    const key = normalize(cell).toLowerCase().replace(/[\s_-]/g, '')
    map.set(key, i)
  })
  return map
}

function col(row: CellValue[], headerMap: Map<string, number>, ...keys: string[]): string {
  for (const k of keys) {
    const idx = headerMap.get(k.toLowerCase().replace(/[\s_-]/g, ''))
    if (idx !== undefined) return normalize(row[idx])
  }
  return ''
}

export async function parseSchuelerXlsx(file: File): Promise<SchuelerImportRow[]> {
  const rows = extractRows(await readXlsxFile(file) as unknown)
  if (rows.length < 2) return []
  const headerMap = buildHeaderMap(rows[0])
  return rows.slice(1).map(row => ({
    _id: generateId(),
    _valid: true,
    _errors: [],
    _sent: false,
    nachname:               col(row, headerMap, 'nachname', 'name', 'familienname', 'last name', 'lastname'),
    vorname:                col(row, headerMap, 'vorname', 'firstname', 'first name', 'rufname'),
    alleVornamen:           col(row, headerMap, 'allevornamen', 'vornamen', 'alle vornamen'),
    geburtsname:            col(row, headerMap, 'geburtsname', 'mädchenname', 'maiden name'),
    geburtsort:             col(row, headerMap, 'geburtsort', 'birthplace'),
    geschlecht:             col(row, headerMap, 'geschlecht', 'gender', 'sex'),
    geburtsdatum:           normalisiereDatum(col(row, headerMap, 'geburtsdatum', 'geburtstag', 'birthdate', 'birthday')),
    staatsangehoerigkeitID: col(row, headerMap, '1. staatsang.', 'staatsangehoerigkeit', 'staatsangehörigkeit', 'nationalität', 'nationality'),
    religionID:             col(row, headerMap, 'konfession', 'religion', 'religionszugehörigkeit'),
    religionKuerzel:        col(row, headerMap, 'statistik krz konfession', 'religionskuerzel', 'konfessionskuerzel'),
    strassenname:           col(row, headerMap, 'straße', 'strasse', 'strassenname', 'street', 'adresse'),
    hausnummer:             col(row, headerMap, 'hausnummer', 'hnr', 'hausnr'),
    plz:                    col(row, headerMap, 'plz', 'postleitzahl', 'postal code', 'zip'),
    ort:                    col(row, headerMap, 'ort', 'wohnort', 'stadt', 'city'),
    ortsteil:               col(row, headerMap, 'ortsteil', 'stadtteil'),
    telefon:                col(row, headerMap, 'telefon', 'tel', 'phone', 'telefonnummer'),
    email:                  col(row, headerMap, 'email', 'e-mail', 'mail', 'emailadresse'),
    status:                 col(row, headerMap, 'status'),
    anmeldedatum:           normalisiereDatum(col(row, headerMap, 'anmeldedatum', 'anmeldung')),
    aufnahmedatum:          normalisiereDatum(col(row, headerMap, 'aufnahmedatum', 'aufnahme')),
    beginnBildungsgang:     normalisiereDatum(col(row, headerMap, 'beginnbildungsgang', 'beginn bildungsgang')),
    klasse:                 col(row, headerMap, 'klasse', 'class', 'klassenbezeichnung'),
    jahrgang:               col(row, headerMap, 'jahrgang', 'jahrgangsstufe', 'grade', 'jg', 'jgst'),
    schulgliederung:        col(row, headerMap, 'schulgliederung', 'gliederung', 'bildungsgang'),
  }))
}

export async function parseFloskelXlsx(file: File): Promise<FloskelImportRow[]> {
  const rows = extractRows(await readXlsxFile(file) as unknown)
  if (rows.length < 2) return []
  const headerMap = buildHeaderMap(rows[0])
  return rows.slice(1).map(row => ({
    _id: generateId(),
    _valid: true,
    _errors: [],
    _sent: false,
    kuerzel:         col(row, headerMap, 'kürzel', 'kuerzel', 'kz'),
    text:            col(row, headerMap, 'floskeltext', 'text', 'inhalt', 'beschreibung'),
    floskelgruppe:   col(row, headerMap, 'gruppe', 'floskelgruppe', 'fg'),
    idFloskelgruppe: col(row, headerMap, 'idfloskelgruppe', 'gruppeid', 'floskelgruppeid'),
    fach:            col(row, headerMap, 'fach'),
    jahrgang:        col(row, headerMap, 'jahrgang', 'jg', 'jahrgangsstufe'),
    niveau:          col(row, headerMap, 'niveau', 'niveaustufe'),
    sortierung:      col(row, headerMap, 'sortierung', 'sort'),
  }))
}

export async function parseLehrerXlsx(file: File): Promise<LehrerImportRow[]> {
  const rows = extractRows(await readXlsxFile(file) as unknown)
  if (rows.length < 2) return []
  const headerMap = buildHeaderMap(rows[0])
  return rows.slice(1).map(row => ({
    _id: generateId(),
    _valid: true,
    _errors: [],
    _sent: false,
    kuerzel: col(row, headerMap, 'kuerzel', 'kürzel', 'abbreviation'),
    nachname: col(row, headerMap, 'nachname', 'name', 'familienname'),
    vorname: col(row, headerMap, 'vorname', 'firstname'),
    personalTyp: col(row, headerMap, 'personaltyp', 'typ', 'type') || 'LEHRKRAFT',
    anrede: col(row, headerMap, 'anrede', 'salutation'),
    titel: col(row, headerMap, 'titel', 'title'),
    geburtsdatum: normalisiereDatum(col(row, headerMap, 'geburtsdatum', 'geburtstag', 'birthdate')),
    geschlecht: col(row, headerMap, 'geschlecht', 'gender'),
    emailDienstlich: col(row, headerMap, 'emaildienstlich', 'email', 'mail'),
    telefon: col(row, headerMap, 'telefon', 'phone', 'tel'),
  }))
}
