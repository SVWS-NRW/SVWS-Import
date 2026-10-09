import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSchuelerAktuell,
  fetchErzieherarten,
  createErzieherart,
  fetchSchuelerErzieher,
  createErzieher,
  patchErzieherZweitePerson,
  fetchOrtsteile,
  type ErzieherVorhanden,
} from '@/services/svwsService'
import { fetchOrteKatalog, resolveWohnortId } from '@/services/katalogService'
import type { OrtKatalogEintrag } from '@/models/ImportSchema'
import {
  type SchuelerErzieherImportRow,
  erzieherPerson1Payload,
  erzieherPerson2Payload,
  hatZweitePerson,
} from '@/models/SchuelerErzieher'
import { normalisiereDatum } from '@/utils/csvParser'

function lookupKey(nachname: string, vorname: string, geburtsdatum: string): string {
  return `${nachname.toLowerCase().trim()}||${vorname.toLowerCase().trim()}||${geburtsdatum.trim()}`
}

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase()

export const useErzieherStore = defineStore('erzieher', () => {
  const rows = ref<SchuelerErzieherImportRow[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)

  const schuelerMap = ref<Map<string, number[]>>(new Map())
  /** Bezeichnung (lowercase) → ID */
  const erzieherartenMap = ref<Map<string, number>>(new Map())
  const orteKatalog = ref<Map<string, OrtKatalogEintrag>>(new Map())
  /** `${ortId}|${ortsteil lowercase}` → ID */
  const ortsteileMap = ref<Map<string, number>>(new Map())
  const lookupLoaded = ref(false)
  const lookupLoading = ref(false)

  const totalCount = computed(() => rows.value.length)
  const validCount = computed(() => rows.value.filter(r => r._valid && !r._sent).length)
  const errorCount = computed(() => rows.value.filter(r => !r._valid && !r._sent).length)
  const sentCount  = computed(() => rows.value.filter(r => r._sent).length)

  async function loadSchuelerLookup(force = false): Promise<{ error?: string }> {
    if (lookupLoaded.value && !force) return {}
    lookupLoading.value = true
    try {
      const [schuelerList, erzieherarten, orte, ortsteile] = await Promise.all([
        fetchSchuelerAktuell(),
        fetchErzieherarten(),
        fetchOrteKatalog().catch(() => new Map<string, OrtKatalogEintrag>()),
        fetchOrtsteile().catch(() => []),
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

      const aMap = new Map<string, number>()
      for (const a of erzieherarten) if (a.bezeichnung) aMap.set(norm(a.bezeichnung), a.id)
      erzieherartenMap.value = aMap

      orteKatalog.value = orte
      const otMap = new Map<string, number>()
      for (const ot of ortsteile) {
        if (ot.ortsteil && ot.ort_id !== null) otMap.set(`${ot.ort_id}|${norm(ot.ortsteil)}`, ot.id)
      }
      ortsteileMap.value = otMap

      lookupLoaded.value = true
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Schülerliste' }
    } finally {
      lookupLoading.value = false
    }
  }

  function resolveWohnort(row: SchuelerErzieherImportRow): number | null {
    if (!row.plz.trim() && !row.ort.trim()) return null
    return resolveWohnortId(orteKatalog.value, row.plz, row.ort)
  }

  function resolveAndValidate(): void {
    for (const row of rows.value) {
      if (row._sent) continue
      if (lookupLoaded.value) {
        const ids = schuelerMap.value.get(lookupKey(row.nachname, row.vorname, row.geburtsdatum))
        if (!ids || ids.length === 0) { row._lookupStatus = 'not_found'; row._schuelerId = null }
        else if (ids.length > 1)      { row._lookupStatus = 'ambiguous'; row._schuelerId = null }
        else                          { row._lookupStatus = 'ok';        row._schuelerId = ids[0] }

        const art = norm(row.erzieherart)
        row._erzieherartStatus = !art ? 'empty' : erzieherartenMap.value.has(art) ? 'found' : 'new'

        if (!row.plz.trim() && !row.ort.trim()) row._wohnortStatus = 'empty'
        else row._wohnortStatus = resolveWohnort(row) !== null ? 'found' : 'not_found'
      }
      const errors: string[] = []
      if (!row.nachname.trim())     errors.push('Nachname des Schülers fehlt')
      if (!row.vorname.trim())      errors.push('Vorname des Schülers fehlt')
      if (!row.geburtsdatum.trim()) errors.push('Geburtsdatum des Schülers fehlt')
      if (!row.nachname1.trim() && !row.vorname1.trim()) errors.push('Name der 1. Person fehlt')
      if (row._lookupStatus === 'not_found') errors.push('Schüler nicht gefunden')
      if (row._lookupStatus === 'ambiguous') errors.push('Schüler nicht eindeutig (mehrere Treffer)')
      if (row._lookupStatus === 'pending')   errors.push('Schüler noch nicht abgeglichen')
      row._errors = errors
      row._valid = errors.length === 0
    }
  }

  function setRows(newRows: SchuelerErzieherImportRow[]): void {
    rows.value = newRows
    resolveAndValidate()
  }

  function updateRow(id: string, changes: Partial<SchuelerErzieherImportRow>): void {
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

  async function uploadAll(selectedIds?: Set<string>): Promise<{ sent: number; skipped: number; failed: number }> {
    const toSend = rows.value.filter(r =>
      r._valid && !r._sent && (selectedIds === undefined || selectedIds.has(r._id)),
    )
    uploading.value = true
    uploadProgress.value = 0
    uploadTotal.value = toSend.length
    uploadCancelled.value = false
    let sent = 0
    let skipped = 0
    let failed = 0

    // Vorhandene Erzieher je Schüler cachen (Duplikaterkennung, auch für mehrere Zeilen je Schüler)
    const vorhandeneCache = new Map<number, ErzieherVorhanden[]>()
    async function getVorhandene(idSchueler: number): Promise<ErzieherVorhanden[]> {
      if (!vorhandeneCache.has(idSchueler)) vorhandeneCache.set(idSchueler, await fetchSchuelerErzieher(idSchueler))
      return vorhandeneCache.get(idSchueler)!
    }

    const fail = (row: SchuelerErzieherImportRow, msg: string) => {
      row._errors = [msg]
      row._valid = false
      failed++
      uploadProgress.value++
    }

    for (const row of toSend) {
      if (uploadCancelled.value) break
      if (!row._schuelerId) { fail(row, 'Schüler nicht zugeordnet'); continue }
      const idSchueler = row._schuelerId

      // Duplikat: gleiche 1. Person ist beim Schüler bereits als Erzieher eingetragen
      let vorhandene: ErzieherVorhanden[]
      try {
        vorhandene = await getVorhandene(idSchueler)
      } catch {
        fail(row, 'Vorhandene Erzieher konnten nicht geladen werden')
        continue
      }
      const istDuplikat = vorhandene.some(e =>
        norm(e.nachname) === norm(row.nachname1) && norm(e.vorname) === norm(row.vorname1))
      if (istDuplikat) {
        row._errors = [`Erzieher „${row.vorname1} ${row.nachname1}" ist beim Schüler bereits vorhanden — übersprungen`]
        row._result = 'uebersprungen'
        row._sent = true
        skipped++
        uploadProgress.value++
        continue
      }

      // Erzieherart → ID, unbekannte Arten werden im Katalog der Schule angelegt
      let idErzieherArt: number | null = null
      const art = row.erzieherart.trim()
      if (art) {
        const cached = erzieherartenMap.value.get(norm(art))
        if (cached !== undefined) {
          idErzieherArt = cached
        } else {
          const created = await createErzieherart(art)
          if ('error' in created) { fail(row, `Erzieherart „${art}" konnte nicht angelegt werden: ${created.error}`); continue }
          erzieherartenMap.value.set(norm(art), created.id)
          idErzieherArt = created.id
          for (const r of rows.value) if (norm(r.erzieherart) === norm(art)) r._erzieherartStatus = 'found'
        }
      }

      const wohnortID = resolveWohnort(row)
      const ortsteilID = wohnortID !== null && row.ortsteil.trim()
        ? ortsteileMap.value.get(`${wohnortID}|${norm(row.ortsteil)}`) ?? null
        : null

      const created = await createErzieher(
        idSchueler,
        erzieherPerson1Payload(row, { idSchueler, idErzieherArt, wohnortID, ortsteilID }),
      )
      if (!created.success || created.id === undefined) {
        fail(row, `Anlegen fehlgeschlagen – ${created.error ?? 'keine ID erhalten'}`)
        continue
      }
      vorhandene.push({ id: created.id, nachname: row.nachname1, vorname: row.vorname1 })

      if (hatZweitePerson(row)) {
        const patched = await patchErzieherZweitePerson(created.id, erzieherPerson2Payload(row))
        if (!patched.success) {
          // 1. Person ist angelegt → Zeile nicht erneut senden
          row._errors = [`1. Person angelegt, 2. Person fehlgeschlagen – ${patched.error}`]
          row._result = 'angelegt'
          row._sent = true
          failed++
          uploadProgress.value++
          continue
        }
      }

      row._errors = []
      row._result = 'angelegt'
      row._sent = true
      sent++
      uploadProgress.value++
    }

    uploading.value = false
    return { sent, skipped, failed }
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
  import.meta.hot.accept(acceptHMRUpdate(useErzieherStore, import.meta.hot))
}
