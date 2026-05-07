import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file/browser'
import type { RawImportData, RawColumn, DetectedColumnType } from '@/models/RawImportData'

const MAX_SAMPLES = 5

function detectType(samples: string[]): DetectedColumnType {
  const nonEmpty = samples.filter(Boolean)
  if (nonEmpty.length === 0) return 'text'
  const dateRe = /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$/
  const numRe = /^\d+([.,]\d+)?$/
  const dateRatio = nonEmpty.filter(s => dateRe.test(s.trim())).length / nonEmpty.length
  const numRatio  = nonEmpty.filter(s => numRe.test(s.trim())).length  / nonEmpty.length
  if (dateRatio >= 0.7) return 'date'
  if (numRatio  >= 0.8) return 'number'
  if (dateRatio > 0 || numRatio > 0) return 'mixed'
  return 'text'
}

function buildColumns(headerRow: string[], dataRows: string[][]): RawColumn[] {
  return headerRow.map((name, index) => {
    const samples = dataRows
      .slice(0, 50)
      .map(r => String(r[index] ?? '').trim())
      .filter(Boolean)
      .slice(0, MAX_SAMPLES)
    return {
      name: name || `Spalte ${index + 1}`,
      index,
      detectedType: detectType(samples),
      samples,
    }
  })
}

/** .dat-Dateien aus SVWS verwenden Pipe als Trennzeichen */
function delimiterForFile(file: File): string {
  return /\.dat$/i.test(file.name) ? '|' : ''
}

/**
 * Öffnet eine Datei beliebigen unterstützten Formats (CSV, DAT, XLSX, XLS)
 * und gibt die Rohdaten ohne Feldmapping zurück.
 * DAT-Dateien werden automatisch mit Pipe-Trennzeichen eingelesen.
 */
export async function parseRawFile(
  file: File,
  firstRowIsHeader = true,
): Promise<RawImportData> {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    return parseRawXlsx(file, 0, firstRowIsHeader)
  }
  return parseRawCsv(file, delimiterForFile(file), firstRowIsHeader)
}

/**
 * Liest eine CSV-Datei ein und gibt die Rohdaten ohne jegliches Feldmapping zurück.
 * @param delimiter Trennzeichen; leer = automatische Erkennung durch PapaParse
 * @param firstRowIsHeader true = erste Zeile enthält Spaltenbezeichnungen
 */
export async function parseRawCsv(
  file: File,
  delimiter = '',
  firstRowIsHeader = true,
): Promise<RawImportData> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      delimiter,
      header: false,
      skipEmptyLines: true,
      complete(results) {
        const allRows = results.data as string[][]
        if (allRows.length === 0) {
          reject(new Error('Keine Daten gefunden'))
          return
        }

        const headerRow = firstRowIsHeader
          ? allRows[0].map(c => String(c).trim())
          : allRows[0].map((_, i) => `Spalte ${String.fromCharCode(65 + i)}`)
        const dataRows = firstRowIsHeader ? allRows.slice(1) : allRows

        const columns = buildColumns(headerRow, dataRows)
        const rows = dataRows.map(r =>
          Object.fromEntries(headerRow.map((h, i) => [h, String(r[i] ?? '').trim()])),
        )

        resolve({
          fileName: file.name,
          columns,
          rows,
          totalRows: dataRows.length,
        })
      },
      error(err) {
        reject(new Error(`CSV-Fehler: ${err.message}`))
      },
    })
  })
}

type CellValue = string | number | boolean | Date | null

function cellToString(val: CellValue): string {
  if (val === null || val === undefined) return ''
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  return String(val).trim()
}

/**
 * Liest ein Excel-Tabellenblatt ein und gibt die Rohdaten zurück.
 * @param sheetIndex 0-basierter Index des Tabellenblatts (Standard: 0)
 * @param firstRowIsHeader true = erste Zeile enthält Spaltenbezeichnungen
 */
export async function parseRawXlsx(
  file: File,
  sheetIndex = 0,
  firstRowIsHeader = true,
): Promise<RawImportData> {
  // Tabellenblattnamen auslesen (optionale Metadaten)
  let sheetNames: string[] = []
  try {
    // read-excel-file liefert mit getSheets: true ein Array von { name: string }
    const sheetsInfo = await (readXlsxFile as unknown as (f: File, opts: object) => Promise<{ name: string }[]>)(
      file,
      { getSheets: true },
    )
    sheetNames = sheetsInfo.map(s => s.name)
  } catch {
    // Ältere Browser oder Bibliotheksversion ohne getSheets-Support
  }

  const sheetOption = sheetNames.length > 0 ? { sheet: sheetIndex + 1 } : {}
  const xlsxRows = await (readXlsxFile as unknown as (f: File, opts: object) => Promise<CellValue[][]>)(
    file,
    sheetOption,
  )

  if (xlsxRows.length === 0) throw new Error('Keine Daten im Tabellenblatt gefunden')

  const headerRow = firstRowIsHeader
    ? xlsxRows[0].map(cellToString)
    : xlsxRows[0].map((_, i) => `Spalte ${String.fromCharCode(65 + i)}`)
  const dataRows = (firstRowIsHeader ? xlsxRows.slice(1) : xlsxRows).map(r => r.map(cellToString))

  const columns = buildColumns(headerRow, dataRows)
  const rows = dataRows.map(r =>
    Object.fromEntries(headerRow.map((h, i) => [h, r[i] ?? ''])),
  )

  return {
    fileName: file.name,
    sheetName: sheetNames[sheetIndex],
    sheetNames,
    columns,
    rows,
    totalRows: dataRows.length,
  }
}
