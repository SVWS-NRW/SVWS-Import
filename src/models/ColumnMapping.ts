export interface ColumnAssignment {
  sourceColumn: string
  /** null = Spalte wird ignoriert */
  targetFieldKey: string | null
  /** true, wenn vom Auto-Matcher vorgeschlagen (noch nicht manuell bestätigt) */
  isSuggested?: boolean
}

export interface ColumnMapping {
  moduleId: string
  assignments: ColumnAssignment[]
}

export interface MappingProfile {
  id: string
  name: string
  description?: string
  moduleId: string
  assignments: ColumnAssignment[]
  createdAt: string
}
