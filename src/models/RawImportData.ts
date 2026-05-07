export type DetectedColumnType = 'text' | 'number' | 'date' | 'mixed'

export interface RawColumn {
  name: string
  index: number
  detectedType: DetectedColumnType
  /** Bis zu 5 repräsentative Beispielwerte (nicht-leer) */
  samples: string[]
}

export interface RawImportData {
  fileName: string
  /** Name des eingelesenen Tabellenblatts (nur bei Excel) */
  sheetName?: string
  /** Alle verfügbaren Tabellenblattnamen (nur bei Excel) */
  sheetNames?: string[]
  columns: RawColumn[]
  /** Alle Datenzeilen als Key-Value-Map (Schlüssel = Spaltenname) */
  rows: Record<string, string>[]
  totalRows: number
}
