import type { ImportModule } from '@/models/ImportSchema'

export const kurseSchema: ImportModule = {
  id: 'kurse',
  entityType: 'kurse',
  moduleType: 'stammdaten',
  label: 'Kurse',
  description: 'Kurse anlegen: Bezeichnung, Fach, Jahrgang, Kursart',
  icon: 'pi pi-table',
  comingSoon: true,
  fields: [],
}
