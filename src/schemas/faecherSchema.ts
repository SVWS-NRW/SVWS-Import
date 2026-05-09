import type { ImportModule } from '@/models/ImportSchema'

export const faecherSchema: ImportModule = {
  id: 'faecher',
  entityType: 'faecher',
  moduleType: 'stammdaten',
  label: 'Fächer',
  description: 'Fächer anlegen: Kürzel, Bezeichnung, Statistikschlüssel',
  icon: 'pi pi-book',
  comingSoon: true,
  fields: [],
}
