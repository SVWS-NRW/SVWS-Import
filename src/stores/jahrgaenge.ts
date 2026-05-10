import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type JahrgangImportRow, type JahrgangDetails } from '@/models/Jahrgaenge'
import { createJahrgang, fetchJahrgaenge } from '@/services/svwsService'

export const useJahrgaengeStore = defineStore('jahrgaenge', () => {
  const rows = ref<JahrgangImportRow[]>([])
  const existingJahrgaenge = ref<JahrgangDetails[]>([])
  const uploading = ref(false)
  const loadingExisting = ref(false)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid).length)

  function setRows(newRows: JahrgangImportRow[]): void {
    rows.value = newRows
  }

  function updateRow(id: string, patch: Partial<JahrgangImportRow>): void {
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
    if (!row.kuerzel.trim()) errors.push('Kürzel fehlt')
    rows.value[idx] = { ...row, _errors: errors, _valid: errors.length === 0 }
  }

  function validateAll(): void {
    rows.value.forEach((_, idx) => validateRow(idx))
  }

  function clear(): void {
    rows.value = []
    existingJahrgaenge.value = []
  }

  async function loadExisting(): Promise<{ error?: string }> {
    loadingExisting.value = true
    try {
      existingJahrgaenge.value = await fetchJahrgaenge()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Jahrgänge' }
    } finally {
      loadingExisting.value = false
    }
  }

  async function uploadAll(): Promise<{ sent: number; failed: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0
    for (let i = 0; i < rows.value.length; i++) {
      const row = rows.value[i]
      if (!row._valid || row._sent) continue
      const result = await createJahrgang(row)
      if (result.success) {
        rows.value[i] = { ...row, _sent: true, _errors: [] }
        sent++
      } else {
        rows.value[i] = { ...row, _errors: [result.error ?? 'Unbekannter Fehler'] }
        failed++
      }
    }
    uploading.value = false
    return { sent, failed }
  }

  return {
    rows, existingJahrgaenge, uploading, loadingExisting,
    totalCount, validCount, sentCount, errorCount,
    setRows, updateRow, deleteRow, validateAll, clear, loadExisting, uploadAll,
  }
})
