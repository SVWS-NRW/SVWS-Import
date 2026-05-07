import type { ImportModule, EntityType } from '@/models/ImportSchema'
import { schuelerStammdatenSchema } from './schuelerStammdatenSchema'
import { lehrerStammdatenSchema } from './lehrerStammdatenSchema'

/**
 * Registry aller verfügbaren Import-Module.
 * Neue Module (Erzieherdaten, Lernabschnittsdaten, …) werden hier registriert.
 */
export const importModules: ImportModule[] = [
  schuelerStammdatenSchema,
  lehrerStammdatenSchema,
]

export function getModuleById(id: string): ImportModule | undefined {
  return importModules.find(m => m.id === id)
}

export function getModulesByEntity(entityType: EntityType): ImportModule[] {
  return importModules.filter(m => m.entityType === entityType)
}

export { schuelerStammdatenSchema, lehrerStammdatenSchema }
