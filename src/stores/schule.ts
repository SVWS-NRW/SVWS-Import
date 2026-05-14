import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type Schuljahresabschnitt, abschnittLabel } from '@/models/Schule'
import { fetchSchuleStammdaten } from '@/services/svwsService'
import { toAppError, reportError } from '@/services/errorService'

export const useSchuleStore = defineStore('schule', () => {
  const abschnitte = ref<Schuljahresabschnitt[]>([])
  const aktuellerAbschnittId = ref<number | null>(null)
  const loaded = ref(false)

  const abschnitteOptions = computed(() =>
    [...abschnitte.value]
      .sort((a, b) => a.schuljahr !== b.schuljahr ? b.schuljahr - a.schuljahr : b.abschnitt - a.abschnitt)
      .map(sja => ({ id: sja.id, label: abschnittLabel(sja) }))
  )

  function labelForId(id: number): string {
    const sja = abschnitte.value.find(a => a.id === id)
    return sja ? abschnittLabel(sja) : `ID ${id}`
  }

  function abschnittForId(id: number): Schuljahresabschnitt | undefined {
    return abschnitte.value.find(a => a.id === id)
  }

  async function fetch(): Promise<void> {
    try {
      const raw = await fetchSchuleStammdaten() as Record<string, unknown>

      // Abschnitte-Array: erst bekannte Feldnamen, dann alle Keys nach passendem Array durchsuchen
      let arr: Schuljahresabschnitt[] = []
      const directArr = raw['schuljahresabschnitte'] ?? raw['schuljahresAbschnitte']
      if (Array.isArray(directArr)) {
        arr = directArr as Schuljahresabschnitt[]
      } else {
        // Selbstheilender Fallback: jedes Array-Feld prüfen ob es Abschnitt-Objekte enthält
        for (const val of Object.values(raw)) {
          if (Array.isArray(val) && val.length > 0) {
            const first = val[0] as Record<string, unknown>
            if (('schuljahr' in first || 'jahr' in first) && ('abschnitt' in first || 'halbjahr' in first)) {
              arr = val as Schuljahresabschnitt[]
              break
            }
          }
        }
      }
      abschnitte.value = arr

      // Aktueller Abschnitt: bekannte Feldnamen probieren, dann nach numerischem Feld mit "abschnitt" suchen
      let id: number | null = null
      const directId = raw['schuljahresabschnitt'] ?? raw['idSchuljahresabschnitt']
      if (typeof directId === 'number') {
        id = directId
      } else {
        for (const [key, val] of Object.entries(raw)) {
          if (typeof val === 'number' && key.toLowerCase().includes('abschnitt')) {
            id = val
            break
          }
        }
      }
      aktuellerAbschnittId.value = id

      // Letzter Fallback: letzter Eintrag der sortierten Liste
      if (aktuellerAbschnittId.value === null && abschnitte.value.length > 0) {
        aktuellerAbschnittId.value = abschnitte.value[abschnitte.value.length - 1].id
      }

      loaded.value = true
    } catch (e) {
      reportError(toAppError(e, 'SchuleStore'))
      loaded.value = false
    }
  }

  function reset(): void {
    abschnitte.value = []
    aktuellerAbschnittId.value = null
    loaded.value = false
  }

  return {
    abschnitte, aktuellerAbschnittId, loaded, abschnitteOptions,
    labelForId, abschnittForId, fetch, reset,
  }
})
