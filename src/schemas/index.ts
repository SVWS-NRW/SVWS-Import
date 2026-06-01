import type { ImportModule, EntityType } from '@/models/ImportSchema'
import { schuelerStammdatenSchema } from './schuelerStammdatenSchema'
import { lehrerStammdatenSchema } from './lehrerStammdatenSchema'
import { klassenSchema } from './klassenSchema'
import { jahrgaengeSchema } from './jahrgaengeSchema'
import { faecherSchema } from './faecherSchema'
import { kurseSchema } from './kurseSchema'
import { betriebeSchema } from './betriebeSchema'

export const importModules: ImportModule[] = [
  schuelerStammdatenSchema,
  lehrerStammdatenSchema,
  klassenSchema,
  jahrgaengeSchema,
  faecherSchema,
  kurseSchema,
  betriebeSchema,
]

export function getModuleById(id: string): ImportModule | undefined {
  return importModules.find(m => m.id === id)
}

export function getModulesByEntity(entityType: EntityType): ImportModule[] {
  return importModules.filter(m => m.entityType === entityType)
}

export { schuelerStammdatenSchema, lehrerStammdatenSchema, klassenSchema, jahrgaengeSchema, faecherSchema, kurseSchema, betriebeSchema }
