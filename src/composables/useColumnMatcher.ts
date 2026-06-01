import type { RawColumn } from '@/models/RawImportData'
import type { FieldDefinition } from '@/models/ImportSchema'
import type { ColumnAssignment, ColumnMapping } from '@/models/ColumnMapping'

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')
}

export function useColumnMatcher() {
  function buildSuggestion(
    columns: RawColumn[],
    fields: FieldDefinition[],
    moduleId: string,
  ): ColumnMapping {
    const usedFieldKeys = new Set<string>()

    const assignments: ColumnAssignment[] = columns.map(col => {
      const normCol = norm(col.name)

      // 1. Exact normalized alias match
      let match: FieldDefinition | undefined
      for (const field of fields) {
        if (usedFieldKeys.has(field.key)) continue
        if (field.aliases.some(a => norm(a) === normCol)) {
          match = field
          break
        }
      }

      // 2. Substring containment (min length 3 to avoid noise)
      if (!match) {
        for (const field of fields) {
          if (usedFieldKeys.has(field.key)) continue
          if (field.aliases.some(a => {
            const normAlias = norm(a)
            return normAlias.length >= 3 && (
              normAlias.includes(normCol) || normCol.includes(normAlias)
            )
          })) {
            match = field
            break
          }
        }
      }

      if (match) usedFieldKeys.add(match.key)

      return {
        sourceColumn: col.name,
        targetFieldKey: match?.key ?? null,
        isSuggested: match !== undefined,
      }
    })

    return { moduleId, assignments }
  }

  return { buildSuggestion }
}
