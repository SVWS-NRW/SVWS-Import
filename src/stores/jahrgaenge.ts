import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type JahrgangImportRow, type JahrgangDetails } from '@/models/Jahrgaenge'
import { createJahrgang, fetchJahrgaenge } from '@/services/svwsService'

export const useJahrgaengeStore = defineStore('jahrgaenge', () => {
  const rows = ref<JahrgangImportRow[]>([])
  const existingJahrgaenge = ref<JahrgangDetails[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)
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

  async function uploadAll(selectedIds?: Set<string>): Promise<{ sent: number; failed: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0
    const useSelection = selectedIds !== undefined && selectedIds.size > 0
    const updated = [...rows.value]
    uploadTotal.value = updated.filter(r => r._valid && !r._sent && (!useSelection || selectedIds!.has(r._id))).length
    uploadProgress.value = 0
    uploadCancelled.value = false
    for (let i = 0; i < updated.length; i++) {
      if (uploadCancelled.value) break
      const row = updated[i]
      if (!row._valid || row._sent) continue
      if (useSelection && !selectedIds!.has(row._id)) continue
      const result = await createJahrgang(row)
      if (result.success) {
        updated[i] = { ...row, _sent: true, _errors: [] }
        sent++
      } else {
        updated[i] = { ...row, _errors: [result.error ?? 'Unbekannter Fehler'] }
        failed++
      }
      uploadProgress.value++
    }
    rows.value = updated
    uploading.value = false
    return { sent, failed }
  }

  function stopUpload(): void {
    uploadCancelled.value = true
  }

  return {
    rows, existingJahrgaenge, uploading, uploadProgress, uploadTotal, loadingExisting,
    totalCount, validCount, sentCount, errorCount,
    setRows, updateRow, deleteRow, validateAll, clear, loadExisting, uploadAll, stopUpload,
  }
})
