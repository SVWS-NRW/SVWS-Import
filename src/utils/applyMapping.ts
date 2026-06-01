import type { RawImportData } from '@/models/RawImportData'
import type { ColumnMapping } from '@/models/ColumnMapping'
import type { ImportModule, MappedRow } from '@/models/ImportSchema'

export function applyMapping(
  rawData: RawImportData,
  mapping: ColumnMapping,
  module: ImportModule,
): MappedRow[] {
  const sourceToTarget = new Map<string, string>()
  for (const a of mapping.assignments) {
    if (a.targetFieldKey !== null) {
      sourceToTarget.set(a.sourceColumn, a.targetFieldKey)
    }
  }

  return rawData.rows.map(rawRow => {
    const row: Record<string, unknown> = {
      _id: crypto.randomUUID(),
      _valid: false,
      _errors: [],
      _sent: false,
    }

    for (const [srcCol, targetKey] of sourceToTarget) {
      row[targetKey] = rawRow[srcCol] ?? ''
    }

    const errors: string[] = []
    for (const field of module.fields) {
      const value = String(row[field.key] ?? '').trim()
      if (field.required && !value) {
        errors.push(`${field.label}: Pflichtfeld fehlt`)
      } else if (field.validate && value) {
        const err = field.validate(value)
        if (err) errors.push(`${field.label}: ${err}`)
      }
    }

    row._valid = errors.length === 0
    row._errors = errors

    return row as MappedRow
  })
}
