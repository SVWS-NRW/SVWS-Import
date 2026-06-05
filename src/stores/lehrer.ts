import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { type LehrerImportRow } from '@/models/Lehrer'
import { createLehrer } from '@/services/svwsService'
import { loadKataloge } from '@/services/katalogService'
import { normalisiereDatum } from '@/utils/csvParser'

export const useLehrerStore = defineStore('lehrer', () => {
  const rows = ref<LehrerImportRow[]>([])
  const unmappedHeaders = ref<string[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid).length)

  function setRows(newRows: LehrerImportRow[], headers: string[] = []): void {
    rows.value = newRows
    unmappedHeaders.value = headers
  }

  function updateRow(id: string, patch: Partial<LehrerImportRow>): void {
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
    if (!row.nachname.trim()) errors.push('Nachname fehlt')
    if (!row.vorname.trim()) errors.push('Vorname fehlt')
    if (row.geburtsdatum && !/^\d{4}-\d{2}-\d{2}$/.test(row.geburtsdatum)) {
      errors.push('Geburtsdatum muss im Format YYYY-MM-DD sein')
    }
    if (row.emailDienstlich && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.emailDienstlich)) {
      errors.push('E-Mail dienstlich ungültig')
    }
    if (row.emailPrivat && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.emailPrivat)) {
      errors.push('E-Mail privat ungültig')
    }
    rows.value[idx] = { ...row, _errors: errors, _valid: errors.length === 0 }
  }

  function validateAll(): void {
    rows.value.forEach((_, idx) => validateRow(idx))
  }

  function applyColumnMapping(mapping: Record<string, string>): void {
    if (Object.keys(mapping).length === 0) return
    const DATE_FIELDS = new Set(['geburtsdatum'])
    rows.value = rows.value.map(row => {
      const patch: Partial<LehrerImportRow> = {}
      for (const [csvHeader, targetField] of Object.entries(mapping)) {
        const raw = row._rawData[csvHeader] ?? ''
        ;(patch as Record<string, string>)[targetField] = DATE_FIELDS.has(targetField)
          ? normalisiereDatum(raw)
          : raw
      }
      return { ...row, ...patch }
    })
    unmappedHeaders.value = unmappedHeaders.value.filter(h => !new Set(Object.keys(mapping)).has(h))
    validateAll()
  }

  function clear(): void {
    rows.value = []
    unmappedHeaders.value = []
  }

  async function uploadAll(selectedIds?: Set<string>): Promise<{ sent: number; failed: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0

    const useSelection = selectedIds !== undefined && selectedIds.size > 0

    let nationalitaetenKatalog: Map<string, string> | undefined
    let orteKatalog: Map<string, import('@/models/ImportSchema').OrtKatalogEintrag> | undefined
    try {
      const kataloge = await loadKataloge()
      nationalitaetenKatalog = kataloge.nationalitaeten
      orteKatalog = kataloge.orte
    } catch {
      // Katalog nicht verfügbar — Lookups werden übersprungen
    }

    const updated = [...rows.value]
    uploadTotal.value = updated.filter(r => r._valid && !r._sent && (!useSelection || selectedIds!.has(r._id))).length
    uploadProgress.value = 0
    uploadCancelled.value = false
    for (let i = 0; i < updated.length; i++) {
      if (uploadCancelled.value) break
      const row = updated[i]
      if (!row._valid || row._sent) continue
      if (useSelection && !selectedIds!.has(row._id)) continue
      const result = await createLehrer(row, nationalitaetenKatalog, orteKatalog)
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
    rows, unmappedHeaders, uploading, uploadProgress, uploadTotal,
    totalCount, validCount, sentCount, errorCount,
    setRows, updateRow, deleteRow, validateAll, clear, uploadAll, stopUpload, applyColumnMapping,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLehrerStore, import.meta.hot))
}
