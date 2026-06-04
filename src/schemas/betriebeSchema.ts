import type { ImportModule } from '@/models/ImportSchema'

export const betriebeSchema: ImportModule = {
  id: 'betriebe',
  entityType: 'betriebe',
  moduleType: 'stammdaten',
  label: 'Betriebe',
  description: 'Ausbildungsbetriebe anlegen: Name, Adresse, Ansprechpartner',
  icon: 'pi pi-building',
  fields: [],
}
