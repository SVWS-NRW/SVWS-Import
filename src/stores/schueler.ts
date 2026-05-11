import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type SchuelerImportRow } from '@/models/Schueler'
import { createSchueler, buildKlassenMap, fetchKlassenDetails, buildJahrgaengeMap, fetchJahrgaenge } from '@/services/svwsService'
import { loadKataloge } from '@/services/katalogService'
import type { OrtKatalogEintrag } from '@/models/ImportSchema'

export const useSchuelerStore = defineStore('schueler', () => {
  const rows = ref<SchuelerImportRow[]>([])
  const uploading = ref(false)
  const idSchuljahresabschnitt = ref<number>(1)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid).length)

  function setRows(newRows: SchuelerImportRow[]): void {
    rows.value = newRows
  }

  function updateRow(id: string, patch: Partial<SchuelerImportRow>): void {
    const idx = rows.value.findIndex(r => r._id === id)
    if (idx !== -1) {
      rows.value[idx] = { ...rows.value[idx], ...patch }
      validateRow(idx)
    }
  }

  function deleteRow(id: string): void {
    rows.value = rows.value.filter(r => r._id !== id)
  }

  function validateRow(idx: number): void {
    const row = rows.value[idx]
    const errors: string[] = []
    if (!row.nachname.trim()) errors.push('Nachname fehlt')
    if (!row.vorname.trim()) errors.push('Vorname fehlt')
    if (row.geburtsdatum && !/^\d{4}-\d{2}-\d{2}$/.test(row.geburtsdatum)) {
      errors.push('Geburtsdatum muss im Format YYYY-MM-DD sein')
    }
    rows.value[idx] = { ...row, _errors: errors, _valid: errors.length === 0 }
  }

  function validateAll(): void {
    rows.value.forEach((_, idx) => validateRow(idx))
  }

  function clear(): void {
    rows.value = []
  }

  async function uploadAll(): Promise<{ sent: number; failed: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0

    let orteKatalog: Map<string, OrtKatalogEintrag> | undefined
    let religionenKatalog: Map<string, import('@/models/ImportSchema').ReligionKatalogEintrag> | undefined
    let klassenMap: Map<string, number> | undefined
    let jahrgaengeMap: Map<string, number> | undefined
    try {
      const [kataloge, klassen, jahrgaenge] = await Promise.all([
        loadKataloge(),
        fetchKlassenDetails(idSchuljahresabschnitt.value),
        fetchJahrgaenge(),
      ])
      orteKatalog       = kataloge.orte
      religionenKatalog = kataloge.religionen
      klassenMap        = buildKlassenMap(klassen)
      jahrgaengeMap     = buildJahrgaengeMap(jahrgaenge)
    } catch {
      // Kataloge nicht verfügbar — Lookups werden übersprungen
    }

    const updated = [...rows.value]
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (!row._valid || row._sent) continue
      const result = await createSchueler(row, idSchuljahresabschnitt.value, orteKatalog, religionenKatalog, klassenMap, jahrgaengeMap)
      if (result.success) {
        updated[i] = { ...row, _sent: true, _errors: [] }
        sent++
      } else {
        updated[i] = { ...row, _errors: [result.error ?? 'Unbekannter Fehler'] }
        failed++
      }
    }
    rows.value = updated
    uploading.value = false
    return { sent, failed }
  }

  return {
    rows, uploading, idSchuljahresabschnitt,
    totalCount, validCount, sentCount, errorCount,
    setRows, updateRow, deleteRow, validateAll, clear, uploadAll,
  }
})
