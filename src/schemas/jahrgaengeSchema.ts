import type { ImportModule } from '@/models/ImportSchema'

export const jahrgaengeSchema: ImportModule = {
  id: 'jahrgaenge',
  entityType: 'jahrgaenge',
  moduleType: 'stammdaten',
  label: 'Jahrgänge',
  description: 'Jahrgangsstufen anlegen: Kürzel, Bezeichnung, Sortierung',
  icon: 'pi pi-calendar',
  fields: [],
}
