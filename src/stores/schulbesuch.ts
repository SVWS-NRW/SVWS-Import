import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSchuelerAktuell,
  patchSchuelerSchulbesuch,
  fetchSchulKatalog,
  fetchAllgemeineSchulen,
  createSchuleInKatalog,
  schulenKatalogToSchulEintrag,
  fetchEntlassgruende,
  fetchJahrgaenge,
  buildJahrgaengeMap,
  type SchulenKatalogEintrag,
} from '@/services/svwsService'
import { fetchAllinoneSchulenKataloge, type JahrgangKatalogEintrag } from '@/services/katalogService'
import { type SchuelerSchulbesuchImportRow, schulbesuchImportToApiPatch } from '@/models/SchuelerSchulbesuch'
import { normalisiereDatum } from '@/utils/csvParser'

function lookupKey(nachname: string, vorname: string, geburtsdatum: string): string {
  return `${nachname.toLowerCase().trim()}||${vorname.toLowerCase().trim()}||${geburtsdatum.trim()}`
}

export const useSchulbesuchStore = defineStore('schulbesuch', () => {
  const rows = ref<SchuelerSchulbesuchImportRow[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)

  const schuelerMap = ref<Map<string, number[]>>(new Map())
  const schulenMap = ref<Map<string, number>>(new Map())
  const schulenVerzeichnisMap = ref<Map<string, SchulenKatalogEintrag>>(new Map())
  const schulformenMap = ref<Map<string, number>>(new Map())
  const schulformKuerzelMap = ref<Map<string, string>>(new Map())
  const jahrgaengeMap = ref<Map<string, JahrgangKatalogEintrag>>(new Map())
  const entlassgruendeSet   = ref<Set<number>>(new Set())
  const schulJahrgaengeMap  = ref<Map<string, number>>(new Map())
  const lookupLoaded = ref(false)
  const lookupLoading = ref(false)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid && !r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid && !r._sent).length)
  const sentCount = computed(() => rows.value.filter(r => r._sent).length)

  async function loadSchuelerLookup(force = false): Promise<{ error?: string }> {
    if (lookupLoaded.value && !force) return {}
    lookupLoading.value = true
    try {
      const [schuelerList, schulen, allgSchulen, allinoneKataloge, entlassgruende, jahrgaenge] = await Promise.all([
        fetchSchuelerAktuell(),
        fetchSchulKatalog(),
        fetchAllgemeineSchulen(),
        fetchAllinoneSchulenKataloge(),
        fetchEntlassgruende(),
        fetchJahrgaenge(),
      ])

      const sMap = new Map<string, number[]>()
      for (const s of schuelerList) {
        const geb = s.geburtsdatum ? normalisiereDatum(s.geburtsdatum) : ''
        const key = lookupKey(s.nachname, s.vorname, geb)
        const ids = sMap.get(key) ?? []
        ids.push(s.id)
        sMap.set(key, ids)
      }
      schuelerMap.value = sMap

      const schMap = new Map<string, number>()
      for (const sch of schulen) {
        if (sch.schulnummerStatistik) {
          schMap.set(sch.schulnummerStatistik.trim(), sch.id)
        }
      }
      schulenMap.value = schMap

      const verzeichnis = new Map<string, SchulenKatalogEintrag>()
      for (const sk of allgSchulen) {
        if (sk.SchulNr) verzeichnis.set(sk.SchulNr.trim(), sk)
      }
      schulenVerzeichnisMap.value = verzeichnis
      schulformenMap.value      = allinoneKataloge.schulformenMap
      schulformKuerzelMap.value = allinoneKataloge.schulformKuerzelMap
      jahrgaengeMap.value       = allinoneKataloge.jahrgaengeMap
      entlassgruendeSet.value   = entlassgruende
      schulJahrgaengeMap.value  = buildJahrgaengeMap(jahrgaenge)

      lookupLoaded.value = true
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Schüler-/Schulliste' }
    } finally {
      lookupLoading.value = false
    }
  }

  function resolveAndValidate(): void {
    for (const row of rows.value) {
      if (row._sent) continue
      if (lookupLoaded.value) {
        const key = lookupKey(row.nachname, row.vorname, row.geburtsdatum)
        const ids = schuelerMap.value.get(key)
        if (!ids || ids.length === 0) {
          row._lookupStatus = 'not_found'
          row._schuelerId = null
        } else if (ids.length > 1) {
          row._lookupStatus = 'ambiguous'
          row._schuelerId = null
        } else {
          row._lookupStatus = 'ok'
          row._schuelerId = ids[0]
        }

        const schulnr = row.vorherigeSchule?.trim()
        if (!schulnr) {
          row._vorherigeSchuleStatus = 'empty'
        } else {
          row._vorherigeSchuleStatus = schulenMap.value.has(schulnr) ? 'found' : 'new'
        }

        const aufnSchulenr = row.aufnehmendeSchule?.trim()
        if (!aufnSchulenr) {
          row._aufnehmendeSchuleStatus = 'empty'
        } else {
          row._aufnehmendeSchuleStatus = schulenMap.value.has(aufnSchulenr) ? 'found' : 'new'
        }

        const jg = row.vorigeEntlassjahrgang?.trim()
        if (!jg) {
          row._vorigeEntlassJahrgangStatus = 'empty'
        } else {
          const jahrgangEintrag = jahrgaengeMap.value.get(jg)
          const sfSchluessel = schulnr ? schulenVerzeichnisMap.value.get(schulnr)?.SF : undefined
          const sfKuerzel = sfSchluessel ? schulformKuerzelMap.value.get(sfSchluessel) : undefined
          row._vorigeEntlassJahrgangStatus =
            jahrgangEintrag && sfKuerzel && !jahrgangEintrag.schulformen.includes(sfKuerzel)
              ? 'invalid_for_schulform'
              : 'valid'
        }

        const validateGrund = (raw: string) => {
          if (!raw.trim()) return 'empty' as const
          const id = parseInt(raw.trim(), 10)
          if (isNaN(id)) return 'invalid' as const
          return entlassgruendeSet.value.size === 0 || entlassgruendeSet.value.has(id) ? 'valid' as const : 'invalid' as const
        }
        row._vorigeEntlassgrundStatus = validateGrund(row.vorigeEntlassgrundID)
        row._entlassungGrundStatus    = validateGrund(row.entlassungGrundID)

        const jgDiese = row.entlassjahrgang?.trim()
        if (!jgDiese) {
          row._entlassJahrgangStatus = 'empty'
        } else {
          row._entlassJahrgangStatus = schulJahrgaengeMap.value.size === 0 || schulJahrgaengeMap.value.has(jgDiese.toLowerCase())
            ? 'valid'
            : 'invalid'
        }
      }
      const errors: string[] = []
      if (!row.nachname.trim())     errors.push('Nachname fehlt')
      if (!row.vorname.trim())      errors.push('Vorname fehlt')
      if (!row.geburtsdatum.trim()) errors.push('Geburtsdatum fehlt')
      if (row._lookupStatus === 'not_found')  errors.push('Schüler nicht gefunden')
      if (row._lookupStatus === 'ambiguous')  errors.push('Schüler nicht eindeutig (mehrere Treffer)')
      if (row._lookupStatus === 'pending')    errors.push('Schüler noch nicht abgeglichen')
      if (row._vorigeEntlassgrundStatus === 'invalid')
        errors.push(`Entlassgrund vorige Schule "${row.vorigeEntlassgrundID.trim()}" ist keine gültige ID`)
      if (row._entlassungGrundStatus === 'invalid')
        errors.push(`Entlassgrund diese Schule "${row.entlassungGrundID.trim()}" ist keine gültige ID`)
      if (row._entlassJahrgangStatus === 'invalid')
        errors.push(`Entlassjahrgang "${row.entlassjahrgang.trim()}" ist kein gültiges Kürzel für diese Schule`)
      row._errors = errors
      row._valid = errors.length === 0
    }
  }

  function setRows(newRows: SchuelerSchulbesuchImportRow[]): void {
    rows.value = newRows
    resolveAndValidate()
  }

  function updateRow(id: string, changes: Partial<SchuelerSchulbesuchImportRow>): void {
    const row = rows.value.find(r => r._id === id)
    if (!row) return
    Object.assign(row, changes)
    resolveAndValidate()
  }

  function deleteRow(id: string): void {
    rows.value = rows.value.filter(r => r._id !== id)
  }

  function clear(): void {
    rows.value = []
  }

  async function uploadAll(selectedIds?: Set<string>): Promise<{ sent: number; failed: number }> {
    const toSend = rows.value.filter(r =>
      r._valid && !r._sent && (selectedIds === undefined || selectedIds.has(r._id)),
    )
    uploading.value = true
    uploadProgress.value = 0
    uploadTotal.value = toSend.length
    uploadCancelled.value = false
    let sent = 0
    let failed = 0

    for (const row of toSend) {
      if (uploadCancelled.value) break
      if (!row._schuelerId) { failed++; uploadProgress.value++; continue }

      // vorherigeSchule (Schulnummer) → DB-ID auflösen oder Schule neu anlegen
      const schulnr = row.vorherigeSchule?.trim()
      let idVorherigeSchule: number | undefined
      if (schulnr) {
        const cachedId = schulenMap.value.get(schulnr)
        if (cachedId) {
          idVorherigeSchule = cachedId
        } else {
          const vollDaten = schulenVerzeichnisMap.value.has(schulnr)
            ? schulenKatalogToSchulEintrag(schulenVerzeichnisMap.value.get(schulnr)!, schulformenMap.value)
            : undefined
          const created = await createSchuleInKatalog(schulnr, vollDaten)
          console.log(`[schulbesuch] createSchuleInKatalog(${schulnr}) →`, created)
          if ('error' in created) {
            row._errors = [`Schule ${schulnr} konnte nicht angelegt werden: ${created.error}`]
            row._valid = false
            failed++
            uploadProgress.value++
            continue
          }
          schulenMap.value.set(schulnr, created.id)
          idVorherigeSchule = created.id
          row._vorherigeSchuleStatus = 'found'
        }
      }

      // aufnehmendeSchule (Schulnummer) → DB-ID auflösen oder Schule neu anlegen
      const aufnSchulenr = row.aufnehmendeSchule?.trim()
      let idAufnehmendeSchule: number | undefined
      if (aufnSchulenr) {
        const cachedAufnId = schulenMap.value.get(aufnSchulenr)
        if (cachedAufnId) {
          idAufnehmendeSchule = cachedAufnId
        } else {
          const vollDatenAufn = schulenVerzeichnisMap.value.has(aufnSchulenr)
            ? schulenKatalogToSchulEintrag(schulenVerzeichnisMap.value.get(aufnSchulenr)!, schulformenMap.value)
            : undefined
          const createdAufn = await createSchuleInKatalog(aufnSchulenr, vollDatenAufn)
          if ('error' in createdAufn) {
            row._errors = [`Aufnehmende Schule ${aufnSchulenr} konnte nicht angelegt werden: ${createdAufn.error}`]
            row._valid = false
            failed++
            uploadProgress.value++
            continue
          }
          schulenMap.value.set(aufnSchulenr, createdAufn.id)
          idAufnehmendeSchule = createdAufn.id
          row._aufnehmendeSchuleStatus = 'found'
        }
      }

      const patch = schulbesuchImportToApiPatch(row)
      if (idVorherigeSchule !== undefined) patch.idVorherigeSchule = idVorherigeSchule
      if (idAufnehmendeSchule !== undefined) patch.idAufnehmendeSchule = idAufnehmendeSchule
      const jgKuerzel = row.entlassjahrgang?.trim()
      if (jgKuerzel) {
        const idJg = schulJahrgaengeMap.value.get(jgKuerzel.toLowerCase())
        if (idJg) patch.idEntlassjahrgangDieseSchule = idJg
      }
      console.log(`[schulbesuch] PATCH /schueler/${row._schuelerId}/schulbesuch`, JSON.stringify(patch))
      if (Object.keys(patch).length === 0) {
        row._errors = ['Keine Felder zum Übertragen']
        row._valid = false
        failed++
        uploadProgress.value++
        continue
      }

      const result = await patchSchuelerSchulbesuch(row._schuelerId, patch)
      console.log(`[schulbesuch] PATCH result:`, result)
      if (result.success) {
        row._sent = true
        sent++
      } else {
        row._errors = [result.error ?? 'Unbekannter Fehler']
        row._valid = false
        console.error(`[schulbesuch] PATCH /schueler/${row._schuelerId}/schulbesuch FEHLER:`, result.error)
        failed++
      }
      uploadProgress.value++
    }

    uploading.value = false
    return { sent, failed }
  }

  function stopUpload(): void {
    uploadCancelled.value = true
  }

  return {
    rows,
    uploading,
    uploadProgress,
    uploadTotal,
    lookupLoading,
    lookupLoaded,
    totalCount,
    validCount,
    errorCount,
    sentCount,
    setRows,
    updateRow,
    deleteRow,
    clear,
    resolveAndValidate,
    loadSchuelerLookup,
    uploadAll,
    stopUpload,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchulbesuchStore, import.meta.hot))
}
