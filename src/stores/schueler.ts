import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { type SchuelerImportRow } from '@/models/Schueler'
import { normalisiereDatum } from '@/utils/csvParser'
import {
  createSchueler,
  updateSchueler,
  fetchSchuelerAktuell,
  buildKlassenMap,
  fetchKlassenDetails,
  buildJahrgaengeMap,
  fetchJahrgaenge,
  type SchuelerKataloge,
} from '@/services/svwsService'
import { loadKataloge } from '@/services/katalogService'

/** Umgang mit Schülern, die bereits in der Datenbank vorhanden sind */
export type SchuelerDuplikatModus = 'ueberspringen' | 'ueberschreiben' | 'neu'

export interface SchuelerUploadErgebnis {
  sent: number
  updated: number
  skipped: number
  failed: number
}

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase()
const lookupKey = (nachname: string, vorname: string, geburtsdatum: string) =>
  `${norm(nachname)}||${norm(vorname)}||${(geburtsdatum ?? '').trim()}`

export const useSchuelerStore = defineStore('schueler', () => {
  const rows = ref<SchuelerImportRow[]>([])
  const unmappedHeaders = ref<string[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)
  const idSchuljahresabschnitt = ref<number>(1)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid).length)

  function setRows(newRows: SchuelerImportRow[], headers: string[] = []): void {
    rows.value = newRows
    unmappedHeaders.value = headers
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
    unmappedHeaders.value = []
  }

  const DATE_FIELDS = new Set(['geburtsdatum', 'anmeldedatum', 'aufnahmedatum', 'beginnBildungsgang'])

  function applyColumnMapping(mapping: Record<string, string>): void {
    if (Object.keys(mapping).length === 0) return
    rows.value = rows.value.map(row => {
      const patch: Partial<SchuelerImportRow> = {}
      for (const [csvHeader, targetField] of Object.entries(mapping)) {
        const raw = row._rawData[csvHeader] ?? ''
        ;(patch as Record<string, string>)[targetField] = DATE_FIELDS.has(targetField)
          ? normalisiereDatum(raw)
          : raw
      }
      return { ...row, ...patch }
    })
    const mappedSet = new Set(Object.keys(mapping))
    unmappedHeaders.value = unmappedHeaders.value.filter(h => !mappedSet.has(h))
    validateAll()
  }

  async function uploadAll(
    selectedIds: Set<string> | undefined,
    modus: SchuelerDuplikatModus,
  ): Promise<SchuelerUploadErgebnis> {
    const ergebnis: SchuelerUploadErgebnis = { sent: 0, updated: 0, skipped: 0, failed: 0 }
    const useSelection = selectedIds !== undefined && selectedIds.size > 0
    uploading.value = true

    const kataloge: SchuelerKataloge = {}
    // Kataloge separat laden: schlägt nicht fehl, wenn einzelne Kataloge nicht verfügbar sind
    try {
      const k = await loadKataloge()
      kataloge.orte                 = k.orte
      kataloge.religionen           = k.religionen
      kataloge.nationalitaetenById  = k.nationalitaetenById
      kataloge.verkehrssprachenById = k.verkehrssprachenById
    } catch {
      // Kataloge nicht verfügbar — Code-Lookups werden übersprungen
    }
    try {
      const [klassen, jahrgaenge] = await Promise.all([
        fetchKlassenDetails(idSchuljahresabschnitt.value),
        fetchJahrgaenge(),
      ])
      kataloge.klassen    = buildKlassenMap(klassen)
      kataloge.jahrgaenge = buildJahrgaengeMap(jahrgaenge)
    } catch {
      // Klassen/Jahrgänge nicht verfügbar — Zuordnungen werden übersprungen
    }

    // Vorhandene Schüler für die Duplikaterkennung; ohne diese Liste wäre „Überspringen“ wirkungslos → abbrechen
    const byKey = new Map<string, number[]>()
    const byId = new Map<number, { nachname: string; vorname: string; geburtsdatum: string }>()
    if (modus !== 'neu') {
      try {
        for (const s of await fetchSchuelerAktuell(true)) {
          const geb = s.geburtsdatum ? normalisiereDatum(s.geburtsdatum) : ''
          const key = lookupKey(s.nachname, s.vorname, geb)
          byKey.set(key, [...(byKey.get(key) ?? []), s.id])
          byId.set(s.id, { nachname: s.nachname, vorname: s.vorname, geburtsdatum: geb })
        }
      } catch (e) {
        uploading.value = false
        const msg = `Vorhandene Schüler konnten nicht geladen werden: ${e instanceof Error ? e.message : 'unbekannter Fehler'}`
        rows.value = rows.value.map(r => {
          if (!r._valid || r._sent || (useSelection && !selectedIds!.has(r._id))) return r
          ergebnis.failed++
          return { ...r, _result: undefined, _errors: [msg] }
        })
        return ergebnis
      }
    }

    /** Vorhandene Schüler zur Zeile: über die Schüler-ID (mit Gegenprüfung) oder Name + Geburtsdatum */
    function findeVorhandene(row: SchuelerImportRow): { ids: number[]; fehler?: string } {
      const rawId = row.schuelerId?.trim()
      if (rawId) {
        const s = /^\d+$/.test(rawId) ? byId.get(Number(rawId)) : undefined
        if (!s) return { ids: [], fehler: `Schüler-ID ${rawId} nicht gefunden` }
        const passt =
          (!row.nachname.trim()     || norm(row.nachname) === norm(s.nachname)) &&
          (!row.vorname.trim()      || norm(row.vorname)  === norm(s.vorname)) &&
          (!row.geburtsdatum.trim() || !s.geburtsdatum   || row.geburtsdatum.trim() === s.geburtsdatum)
        if (!passt) return { ids: [], fehler: `Schüler-ID ${rawId} passt nicht zu Name/Geburtsdatum` }
        return { ids: [Number(rawId)] }
      }
      return { ids: byKey.get(lookupKey(row.nachname, row.vorname, row.geburtsdatum)) ?? [] }
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
      uploadProgress.value++

      if (modus !== 'neu') {
        const { ids, fehler } = findeVorhandene(row)
        if (fehler) {
          updated[i] = { ...row, _result: undefined, _errors: [fehler] }
          ergebnis.failed++
          continue
        }
        if (ids.length > 0 && modus === 'ueberspringen') {
          // Nicht als gesendet markieren: die Zeile kann später mit einem anderen Modus erneut gesendet werden
          updated[i] = { ...row, _result: 'uebersprungen', _errors: ['Schüler ist bereits vorhanden — übersprungen'] }
          ergebnis.skipped++
          continue
        }
        if (ids.length > 1) {
          updated[i] = { ...row, _result: undefined, _errors: [`Schüler nicht eindeutig (${ids.length} Treffer) — bitte Schüler-ID angeben`] }
          ergebnis.failed++
          continue
        }
        if (ids.length === 1) {
          const result = await updateSchueler(ids[0], row, idSchuljahresabschnitt.value, kataloge)
          if (result.success) {
            updated[i] = { ...row, _sent: true, _result: 'ueberschrieben', _errors: [] }
            ergebnis.updated++
          } else {
            updated[i] = { ...row, _result: undefined, _errors: [result.error ?? 'Unbekannter Fehler'] }
            ergebnis.failed++
          }
          continue
        }
      }

      const result = await createSchueler(row, idSchuljahresabschnitt.value, kataloge)
      if (result.success) {
        updated[i] = { ...row, _sent: true, _result: 'angelegt', _errors: [] }
        ergebnis.sent++
        // Gleicher Schüler weiter unten in der Datei → als vorhanden erkennen
        if (result.id) {
          const key = lookupKey(row.nachname, row.vorname, row.geburtsdatum)
          byKey.set(key, [...(byKey.get(key) ?? []), result.id])
          byId.set(result.id, { nachname: row.nachname, vorname: row.vorname, geburtsdatum: row.geburtsdatum })
        }
      } else {
        updated[i] = { ...row, _result: undefined, _errors: [result.error ?? 'Unbekannter Fehler'] }
        ergebnis.failed++
      }
    }
    rows.value = updated
    uploading.value = false
    return ergebnis
  }

  function stopUpload(): void {
    uploadCancelled.value = true
  }

  return {
    rows, unmappedHeaders, uploading, uploadProgress, uploadTotal, idSchuljahresabschnitt,
    totalCount, validCount, sentCount, errorCount,
    setRows, updateRow, deleteRow, validateAll, clear, uploadAll, stopUpload, applyColumnMapping,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchuelerStore, import.meta.hot))
}
