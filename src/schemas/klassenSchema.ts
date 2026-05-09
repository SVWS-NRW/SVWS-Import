import type { ImportModule } from '@/models/ImportSchema'

export const klassenSchema: ImportModule = {
  id: 'klassen',
  entityType: 'klassen',
  moduleType: 'stammdaten',
  label: 'Klassen',
  description: 'Klassen anlegen: Bezeichnung, Jahrgang, Klassenleitung',
  icon: 'pi pi-sitemap',
  comingSoon: true,
  fields: [],
}
