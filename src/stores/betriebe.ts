import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BetriebImportRow, BetriebDetails, AnsprechpartnerImportRow, AnsprechpartnerDetails } from '@/models/Betriebe'
import { fetchBetriebe, createBetrieb, createAnsprechpartner } from '@/services/svwsService'
import { fetchOrteKatalog } from '@/services/katalogService'
import type { OrtKatalogEintrag } from '@/models/ImportSchema'

export const useBetriebeStore = defineStore('betriebe', () => {
  const betriebeRows = ref<BetriebImportRow[]>([])
  const ansprechpartnerRows = ref<AnsprechpartnerImportRow[]>([])
  const existingBetriebe = ref<BetriebDetails[]>([])
  const orteKatalog = ref<Map<string, OrtKatalogEintrag> | null>(null)

  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)
  const loadingExisting = ref(false)

  // Betriebe Stats
  const betriebeTotalCount = computed(() => betriebeRows.value.length)
  const betriebeValidCount = computed(() => betriebeRows.value.filter(r => r._valid).length)
  const betriebeSentCount = computed(() => betriebeRows.value.filter(r => r._sent).length)
  const betriebeErrorCount = computed(() => betriebeRows.value.filter(r => !r._valid).length)

  // Ansprechpartner Stats
  const apTotalCount = computed(() => ansprechpartnerRows.value.length)
  const apValidCount = computed(() => ansprechpartnerRows.value.filter(r => r._valid).length)
  const apSentCount = computed(() => ansprechpartnerRows.value.filter(r => r._sent).length)
  const apErrorCount = computed(() => ansprechpartnerRows.value.filter(r => !r._valid).length)

  // Alle Ansprechpartner aus existierenden Betrieben (für die Anzeige-Tabelle)
  const existingAnsprechpartner = computed<(AnsprechpartnerDetails & { betriebName: string })[]>(() =>
    existingBetriebe.value.flatMap(b =>
      (b.ansprechpartner ?? []).map(ap => ({
        ...ap,
        betriebName: b.name ?? '',
      })),
    ),
  )

  // Map betriebName (lowercase) → id — aus DB + bereits gesendeten Import-Zeilen
  function buildBetriebNameMap(): Map<string, number> {
    const map = new Map<string, number>()
    for (const b of existingBetriebe.value) {
      if (b.name) map.set(b.name.trim().toLowerCase(), b.id)
    }
    for (const row of betriebeRows.value) {
      if (row._sent && row._createdId && row.name) {
        map.set(row.name.trim().toLowerCase(), row._createdId)
      }
    }
    return map
  }

  // ── Betriebe ──────────────────────────────────────────────────────────────

  function setBetriebeRows(newRows: BetriebImportRow[]): void {
    betriebeRows.value = newRows
  }

  function updateBetriebeRow(id: string, patch: Partial<BetriebImportRow>): void {
    const idx = betriebeRows.value.findIndex(r => r._id === id)
    if (idx !== -1) {
      betriebeRows.value[idx] = { ...betriebeRows.value[idx], ...patch }
      validateBetriebeRow(idx)
    }
  }

  function deleteBetriebeRow(id: string): void {
    betriebeRows.value = betriebeRows.value.filter(r => r._id !== id)
  }

  function validateBetriebeRow(idx: number): void {
    const row = betriebeRows.value[idx]
    const errors: string[] = []
    if (!row.name?.trim()) errors.push('Name fehlt')
    betriebeRows.value[idx] = { ...row, _errors: errors, _valid: errors.length === 0 }
  }

  function validateAllBetriebe(): void {
    betriebeRows.value.forEach((_, idx) => validateBetriebeRow(idx))
  }

  // ── Ansprechpartner ───────────────────────────────────────────────────────

  function setAnsprechpartnerRows(newRows: AnsprechpartnerImportRow[]): void {
    ansprechpartnerRows.value = newRows
  }

  function updateAnsprechpartnerRow(id: string, patch: Partial<AnsprechpartnerImportRow>): void {
    const idx = ansprechpartnerRows.value.findIndex(r => r._id === id)
    if (idx !== -1) {
      ansprechpartnerRows.value[idx] = { ...ansprechpartnerRows.value[idx], ...patch }
      validateAnsprechpartnerRow(idx)
    }
  }

  function deleteAnsprechpartnerRow(id: string): void {
    ansprechpartnerRows.value = ansprechpartnerRows.value.filter(r => r._id !== id)
  }

  function validateAnsprechpartnerRow(idx: number): void {
    const row = ansprechpartnerRows.value[idx]
    const errors: string[] = []
    if (!row.betriebName?.trim()) errors.push('Betrieb fehlt')
    if (!row.name?.trim() && !row.rufname?.trim()) errors.push('Name oder Rufname fehlt')
    ansprechpartnerRows.value[idx] = { ...row, _errors: errors, _valid: errors.length === 0 }
  }

  function validateAllAnsprechpartner(): void {
    ansprechpartnerRows.value.forEach((_, idx) => validateAnsprechpartnerRow(idx))
  }

  // ── Laden & Hochladen ─────────────────────────────────────────────────────

  async function loadExisting(): Promise<{ error?: string }> {
    loadingExisting.value = true
    try {
      const [betriebe, orte] = await Promise.allSettled([
        fetchBetriebe(),
        fetchOrteKatalog(),
      ])
      if (betriebe.status === 'fulfilled') existingBetriebe.value = betriebe.value
      if (orte.status === 'fulfilled') orteKatalog.value = orte.value
      if (betriebe.status === 'rejected') throw betriebe.reason
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Betriebe' }
    } finally {
      loadingExisting.value = false
    }
  }

  async function uploadBetriebe(selectedIds?: Set<string>): Promise<{ sent: number; failed: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0
    const useSelection = selectedIds !== undefined && selectedIds.size > 0
    const updated = [...betriebeRows.value]
    uploadTotal.value = updated.filter(r => r._valid && !r._sent && (!useSelection || selectedIds!.has(r._id))).length
    uploadProgress.value = 0
    uploadCancelled.value = false

    for (let i = 0; i < updated.length; i++) {
      if (uploadCancelled.value) break
      const row = updated[i]
      if (!row._valid || row._sent) continue
      if (useSelection && !selectedIds!.has(row._id)) continue

      const result = await createBetrieb(row, orteKatalog.value ?? undefined)
      if (result.success) {
        updated[i] = { ...row, _sent: true, _errors: [], _createdId: result.id }
        sent++
      } else {
        updated[i] = { ...row, _errors: [result.error ?? 'Unbekannter Fehler'] }
        failed++
      }
      uploadProgress.value++
    }
    betriebeRows.value = updated
    uploading.value = false
    return { sent, failed }
  }

  async function uploadAnsprechpartner(
    selectedIds?: Set<string>,
    fallbackBetriebId?: number,
  ): Promise<{ sent: number; failed: number; unresolved: number; fallback: number }> {
    uploading.value = true
    let sent = 0
    let failed = 0
    let unresolved = 0
    let fallback = 0
    const useSelection = selectedIds !== undefined && selectedIds.size > 0
    const betriebMap = buildBetriebNameMap()
    const updated = [...ansprechpartnerRows.value]
    uploadTotal.value = updated.filter(r => r._valid && !r._sent && (!useSelection || selectedIds!.has(r._id))).length
    uploadProgress.value = 0
    uploadCancelled.value = false

    for (let i = 0; i < updated.length; i++) {
      if (uploadCancelled.value) break
      const row = updated[i]
      if (!row._valid || row._sent) continue
      if (useSelection && !selectedIds!.has(row._id)) continue

      let idBetrieb = betriebMap.get(row.betriebName.trim().toLowerCase())
      if (!idBetrieb) {
        if (fallbackBetriebId) {
          idBetrieb = fallbackBetriebId
          fallback++
        } else {
          updated[i] = { ...row, _errors: [`Betrieb "${row.betriebName}" nicht gefunden`], _valid: false }
          unresolved++
          uploadProgress.value++
          continue
        }
      }

      const result = await createAnsprechpartner(row, idBetrieb)
      if (result.success) {
        updated[i] = { ...row, _sent: true, _errors: [] }
        sent++
      } else {
        updated[i] = { ...row, _errors: [result.error ?? 'Unbekannter Fehler'] }
        failed++
      }
      uploadProgress.value++
    }
    ansprechpartnerRows.value = updated
    uploading.value = false
    return { sent, failed, unresolved, fallback }
  }

  function stopUpload(): void {
    uploadCancelled.value = true
  }

  function clearBetriebe(): void {
    betriebeRows.value = []
  }

  function clearAnsprechpartner(): void {
    ansprechpartnerRows.value = []
  }

  return {
    betriebeRows,
    ansprechpartnerRows,
    existingBetriebe,
    existingAnsprechpartner,
    uploading,
    uploadProgress,
    uploadTotal,
    loadingExisting,
    betriebeTotalCount,
    betriebeValidCount,
    betriebeSentCount,
    betriebeErrorCount,
    apTotalCount,
    apValidCount,
    apSentCount,
    apErrorCount,
    setBetriebeRows,
    updateBetriebeRow,
    deleteBetriebeRow,
    validateAllBetriebe,
    setAnsprechpartnerRows,
    updateAnsprechpartnerRow,
    deleteAnsprechpartnerRow,
    validateAllAnsprechpartner,
    loadExisting,
    uploadBetriebe,
    uploadAnsprechpartner,
    stopUpload,
    clearBetriebe,
    clearAnsprechpartner,
  }
})
