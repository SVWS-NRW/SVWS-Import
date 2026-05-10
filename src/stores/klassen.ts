import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type KlasseImportRow, type KlasseDetails } from '@/models/Klassen'
import { type JahrgangDetails } from '@/models/Jahrgaenge'
import { createKlasse, fetchKlassenDetails } from '@/services/svwsService'

export const useKlassenStore = defineStore('klassen', () => {
  const rows = ref<KlasseImportRow[]>([])
  const existingKlassen = ref<KlasseDetails[]>([])
  const uploading = ref(false)
  const loadingExisting = ref(false)
  const idSchuljahresabschnitt = ref<number>(1)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid).length)

  const fileJahr = computed(() => rows.value.find(r => r.jahr)?.jahr ?? '')
  const fileAbschnitt = computed(() => rows.value.find(r => r.abschnitt)?.abschnitt ?? '')

  function setRows(newRows: KlasseImportRow[]): void {
    rows.value = newRows
  }

  function updateRow(id: string, patch: Partial<KlasseImportRow>): void {
    const idx = rows.value.findIndex(r => r._id === id)
    if (idx !== -1) {
      rows.value[idx] = { ...rows.value[idx], ...patch }
      validateRow(idx)
    }
  }

  function deleteRow(id: string): void {
    rows.value = rows.value.filter(r => r._id !== id)
  }

  function normalizeJg(s: string): string {
    const trimmed = s.trim().toLowerCase().replace(/^0+/, '')
    return trimmed || '0'
  }

  function resolveJahrgaenge(jahrgaenge: JahrgangDetails[]): void {
    rows.value = rows.value.map(row => {
      if (!row.jahrgang.trim()) return { ...row, idJahrgang: null }
      const norm = normalizeJg(row.jahrgang)
      const match = jahrgaenge.find(j =>
        normalizeJg(j.kuerzel ?? '') === norm ||
        normalizeJg(j.kuerzelStatistik ?? '') === norm
      )
      return { ...row, idJahrgang: match?.id ?? null }
    })
    validateAll()
  }

  function validateRow(idx: number): void {
    const row = rows.value[idx]
    const errors: string[] = []
    if (!row.kuerzel.trim()) errors.push('Kürzel fehlt')
    rows.value[idx] = { ...row, _errors: errors, _valid: errors.length === 0 }
  }

  function validateAll(): void {
    rows.value.forEach((_, idx) => validateRow(idx))
  }

  function clear(): void {
    rows.value = []
    existingKlassen.value = []
  }

  async function loadExisting(): Promise<{ error?: string }> {
    loadingExisting.value = true
    try {
      existingKlassen.value = await fetchKlassenDetails(idSchuljahresabschnitt.value)
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Klassen' }
    } finally {
      loadingExisting.value = false
    }
  }

  async function uploadAll(): Promise<{ sent: number; failed: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0
    const updated = [...rows.value]
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i]
      if (!row._valid || row._sent) continue
      const result = await createKlasse(row, idSchuljahresabschnitt.value)
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
    rows, existingKlassen, uploading, loadingExisting, idSchuljahresabschnitt,
    totalCount, validCount, sentCount, errorCount, fileJahr, fileAbschnitt,
    setRows, updateRow, deleteRow, validateAll, resolveJahrgaenge, clear, loadExisting, uploadAll,
  }
})
