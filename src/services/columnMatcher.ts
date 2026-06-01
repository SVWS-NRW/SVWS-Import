import type { ImportModule, FieldDefinition } from '@/models/ImportSchema'
import type { ColumnMapping, ColumnAssignment } from '@/models/ColumnMapping'
import type { RawColumn } from '@/models/RawImportData'

// Normalisiert einen String für den Vergleich: Kleinbuchstaben, Umlaute umschreiben,
// Leerzeichen/Sonderzeichen entfernen
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[\s_\-./,;:()[\]]/g, '')
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Inhaltsbasierte Erkennung: sind ≥70% der Samples datumähnlich?
function isDateLike(samples: string[]): boolean {
  const nonEmpty = samples.filter(Boolean)
  if (nonEmpty.length === 0) return false
  const dateRe = /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$/
  return nonEmpty.filter(s => dateRe.test(s.trim())).length / nonEmpty.length >= 0.7
}

// Sind ≥80% der Samples rein numerisch?
function isNumberLike(samples: string[]): boolean {
  const nonEmpty = samples.filter(Boolean)
  if (nonEmpty.length === 0) return false
  return nonEmpty.filter(s => /^\d+([.,]\d+)?$/.test(s.trim())).length / nonEmpty.length >= 0.8
}

function scoreField(sourceNorm: string, field: FieldDefinition): number {
  let best = 0

  for (const alias of field.aliases) {
    const aliasNorm = normalize(alias)

    if (aliasNorm === sourceNorm) return 100         // exakter Treffer

    if (sourceNorm.startsWith(aliasNorm) || aliasNorm.startsWith(sourceNorm)) {
      best = Math.max(best, 80)
      continue
    }
    if (sourceNorm.includes(aliasNorm) || aliasNorm.includes(sourceNorm)) {
      // Nur werten wenn der kürzere String mindestens halb so lang wie der längere ist,
      // sonst matchen generische Kurzwörter wie "Jahr" fälschlich auf "Zuzugsjahr" etc.
      const ratio = Math.min(sourceNorm.length, aliasNorm.length) / Math.max(sourceNorm.length, aliasNorm.length)
      if (ratio > 0.5) best = Math.max(best, 60)
      continue
    }

    const dist = levenshtein(sourceNorm, aliasNorm)
    if (dist <= 2) best = Math.max(best, 40)
    else if (dist <= 4) best = Math.max(best, 20)
  }

  return best
}

/**
 * Erzeugt ein automatisches ColumnMapping auf Basis von Heuristiken.
 * Jede Quellspalte wird mit dem am besten passenden Zielfeld verknüpft
 * (oder auf null gesetzt, falls kein ausreichender Match gefunden wurde).
 * Alle Assignments werden als isSuggested=true markiert.
 */
export function suggestMapping(module: ImportModule, columns: RawColumn[]): ColumnMapping {
  const assignments: ColumnAssignment[] = columns.map(col => {
    const sourceNorm = normalize(col.name)
    let bestField: FieldDefinition | null = null
    let bestScore = 0

    for (const field of module.fields) {
      let score = scoreField(sourceNorm, field)

      // Inhaltsbonus: Spalteninhalt stimmt mit erwartetem Feldtyp überein
      if (field.type === 'date' && isDateLike(col.samples)) score += 15
      if (field.type === 'number' && isNumberLike(col.samples)) score += 10

      if (score > bestScore) {
        bestScore = score
        bestField = field
      }
    }

    return {
      sourceColumn: col.name,
      // Mindest-Score 40 um Rauschen zu vermeiden
      targetFieldKey: bestScore >= 40 ? bestField!.key : null,
      isSuggested: true,
    }
  })

  return { moduleId: module.id, assignments }
}
