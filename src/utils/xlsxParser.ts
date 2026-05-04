import readXlsxFile from 'read-excel-file/browser'
import { type SchuelerImportRow } from '@/models/Schueler'
import { type LehrerImportRow } from '@/models/Lehrer'
import { generateId } from './idHelper'
import { normalisiereDatum } from './csvParser'

type CellValue = string | number | boolean | Date | null

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
  const rows = await readXlsxFile(file) as unknown as CellValue[][]
  if (rows.length < 2) return []
  const headerMap = buildHeaderMap(rows[0])
  return rows.slice(1).map(row => ({
    _id: generateId(),
    _valid: true,
    _errors: [],
    _sent: false,
    nachname: col(row, headerMap, 'nachname', 'name', 'familienname'),
    vorname: col(row, headerMap, 'vorname', 'firstname'),
    alleVornamen: col(row, headerMap, 'allevornamen', 'vornamen'),
    geschlecht: col(row, headerMap, 'geschlecht', 'gender'),
    geburtsdatum: normalisiereDatum(col(row, headerMap, 'geburtsdatum', 'geburtstag', 'birthdate')),
    status: col(row, headerMap, 'status'),
    anmeldedatum: normalisiereDatum(col(row, headerMap, 'anmeldedatum')),
    aufnahmedatum: normalisiereDatum(col(row, headerMap, 'aufnahmedatum')),
    klasse: col(row, headerMap, 'klasse', 'class', 'klassenbezeichnung'),
    jahrgang: col(row, headerMap, 'jahrgang', 'jahrgangsstufe', 'grade'),
  }))
}

export async function parseLehrerXlsx(file: File): Promise<LehrerImportRow[]> {
  const rows = await readXlsxFile(file) as unknown as CellValue[][]
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
