export type FieldType = 'string' | 'date' | 'number' | 'enum' | 'boolean'

export type EntityType = 'schueler' | 'lehrer' | 'klassen' | 'kurse' | 'jahrgaenge' | 'faecher' | 'betriebe'

export type ModuleType =
  | 'stammdaten'
  | 'erzieherdaten'
  | 'lernabschnitt'
  | 'leistungen'
  | 'zusatzdaten'
  | 'sonstiges'

export interface EnumOption {
  value: string
  label: string
  aliases: string[]
}

export interface FieldDefinition {
  key: string
  label: string
  category: string
  required: boolean
  type: FieldType
  aliases: string[]
  enumOptions?: EnumOption[]
  hint?: string
  validate?: (value: string) => string | null
}

export interface OrtKatalogEintrag {
  id: number
  plz: string | null
  ortsname: string | null
}

export interface ReligionKatalogEintrag {
  id: number
  bezeichnung: string | null
  kuerzel: string | null
}

export interface ImportKataloge {
  /** schluessel (codeDEStatis, z.B. "000") → kuerzel (ISO-3, z.B. "DEU") */
  nationalitaeten?: Map<string, string>
  /** "PLZ|ortsname" (lowercase) → OrtKatalogEintrag */
  orte?: Map<string, OrtKatalogEintrag>
  /** kuerzel (uppercase) → ReligionKatalogEintrag */
  religionen?: Map<string, ReligionKatalogEintrag>
  /** kuerzel.toLowerCase() → id */
  klassen?: Map<string, number>
  /** kuerzel.toLowerCase() → id */
  jahrgaenge?: Map<string, number>
}

export interface ImportContext {
  idSchuljahresabschnitt?: number
  kataloge?: ImportKataloge
}

// MappedRow: meta-Felder mit festen Typen + dynamische Datenfelder als unknown
export interface MappedRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
  _serverError?: string
  [fieldKey: string]: unknown
}

export interface ImportModule {
  id: string
  entityType: EntityType
  moduleType: ModuleType
  label: string
  description: string
  icon: string
  fields: FieldDefinition[]
  /** IDs von Modulen, die vor diesem importiert sein müssen (z.B. Stammdaten vor Lernabschnitt) */
  requiredModules?: string[]
  toApiPayload?: (row: MappedRow, context: ImportContext) => unknown
  /** Modul noch nicht implementiert — Kachel wird als Vorschau angezeigt */
  comingSoon?: boolean
}
