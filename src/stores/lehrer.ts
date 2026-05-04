import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type LehrerImportRow } from '@/models/Lehrer'
import { createLehrer } from '@/services/svwsService'

export const useLehrerStore = defineStore('lehrer', () => {
  const rows = ref<LehrerImportRow[]>([])
  const uploading = ref(false)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid).length)

  function setRows(newRows: LehrerImportRow[]): void {
    rows.value = newRows
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
      errors.push('E-Mail-Adresse ungültig')
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
    for (let i = 0; i < rows.value.length; i++) {
      const row = rows.value[i]
      if (!row._valid || row._sent) continue
      const result = await createLehrer(row)
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
    rows, uploading,
    totalCount, validCount, sentCount, errorCount,
    setRows, updateRow, deleteRow, validateAll, clear, uploadAll,
  }
})
