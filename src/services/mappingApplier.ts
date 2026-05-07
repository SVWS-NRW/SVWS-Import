import type { ImportModule, MappedRow } from '@/models/ImportSchema'
import type { ColumnMapping } from '@/models/ColumnMapping'
import type { RawImportData } from '@/models/RawImportData'
import { generateId } from '@/utils/idHelper'
import { normalisiereDatum } from '@/utils/csvParser'

/**
 * Wendet ein ColumnMapping auf Rohdaten an und erzeugt validierte MappedRows.
 * Pro Zeile werden:
 *  1. Feldwerte aus den zugeordneten Quellspalten extrahiert
 *  2. Datumsfelder normalisiert
 *  3. Felddefinitions-Validierungen ausgeführt
 */
export function applyMapping(
  rawData: RawImportData,
  mapping: ColumnMapping,
  module: ImportModule,
): MappedRow[] {
  // Lookup: Zielfeld-Key → Quellspaltenname
  const fieldToSource = new Map<string, string>()
  for (const assignment of mapping.assignments) {
    if (assignment.targetFieldKey) {
      fieldToSource.set(assignment.targetFieldKey, assignment.sourceColumn)
    }
  }

  return rawData.rows.map(rawRow => {
    const row: MappedRow = {
      _id: generateId(),
      _valid: true,
      _errors: [],
      _sent: false,
    }

    for (const field of module.fields) {
      const sourceCol = fieldToSource.get(field.key)
      let value = sourceCol ? String(rawRow[sourceCol] ?? '').trim() : ''

      if (field.type === 'date' && value) {
        value = normalisiereDatum(value)
      }

      row[field.key] = value
    }

    // Validierung aller Felder
    const errors: string[] = []
    for (const field of module.fields) {
      const value = String(row[field.key] ?? '').trim()
      if (field.required && !value) {
        errors.push(`${field.label} ist ein Pflichtfeld`)
      } else if (field.validate && value) {
        const err = field.validate(value)
        if (err) errors.push(err)
      }
    }

    row._errors = errors
    row._valid = errors.length === 0

    return row
  })
}

/**
 * Revalidiert eine einzelne Zeile anhand des Modulschemas.
 * Wird beim Inline-Editing aufgerufen.
 */
export function revalidateRow(row: MappedRow, module: ImportModule): MappedRow {
  const errors: string[] = []
  for (const field of module.fields) {
    const value = String(row[field.key] ?? '').trim()
    if (field.required && !value) {
      errors.push(`${field.label} ist ein Pflichtfeld`)
    } else if (field.validate && value) {
      const err = field.validate(value)
      if (err) errors.push(err)
    }
  }
  return { ...row, _errors: errors, _valid: errors.length === 0 }
}
