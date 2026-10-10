import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSchuelerAktuell,
  fetchErzieherarten,
  createErzieherart,
  fetchSchuelerErzieher,
  createErzieher,
  patchErzieherZweitePerson,
  patchErzieher,
  fetchOrtsteile,
  type ErzieherVorhanden,
  type SchuelerListeEintrag,
} from '@/services/svwsService'
import { loadKataloge, resolveWohnortId, resolveNationalitaetId } from '@/services/katalogService'
import type { OrtKatalogEintrag } from '@/models/ImportSchema'
import {
  type SchuelerErzieherImportRow,
  type ErzieherStammdatenPayload,
  erzieherPerson1Payload,
  erzieherPerson2Payload,
  hatZweitePerson,
} from '@/models/SchuelerErzieher'
import { normalisiereDatum } from '@/utils/csvParser'

function lookupKey(nachname: string, vorname: string, geburtsdatum: string): string {
  return `${nachname.toLowerCase().trim()}||${vorname.toLowerCase().trim()}||${geburtsdatum.trim()}`
}

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase()

/** Umgang mit Erziehern, die beim Schüler bereits vorhanden sind (gleicher Name der 1. Person) */
export type DuplikatModus = 'ueberspringen' | 'ueberschreiben' | 'zusaetzlich'

/**
 * Für das Überschreiben: leere Werte nicht senden, damit vorhandene Daten erhalten bleiben.
 * wohnortID und ortsteilID werden nur gemeinsam gesendet (API-Anforderung).
 */
function ohneLeereFelder(payload: ErzieherStammdatenPayload): Partial<ErzieherStammdatenPayload> {
  const { idSchueler: _idSchueler, wohnortID, ortsteilID, ...rest } = payload
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) if (v !== null && v !== undefined) result[k] = v
  if (wohnortID !== null && wohnortID !== undefined) { result.wohnortID = wohnortID; result.ortsteilID = ortsteilID ?? null }
  return result as Partial<ErzieherStammdatenPayload>
}

export const useErzieherStore = defineStore('erzieher', () => {
  const rows = ref<SchuelerErzieherImportRow[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)

  const schuelerMap = ref<Map<string, number[]>>(new Map())
  const schuelerById = ref<Map<number, SchuelerListeEintrag>>(new Map())
  /** Bezeichnung (lowercase) → ID */
  const erzieherartenMap = ref<Map<string, number>>(new Map())
  const orteKatalog = ref<Map<string, OrtKatalogEintrag>>(new Map())
  /** ISO-3, DEStatis-Schlüssel, Bezeichnung → Katalog-ID (aus allinone.json) */
  const nationalitaetenById = ref<Map<string, number>>(new Map())
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
      const [schuelerList, erzieherarten, kataloge, ortsteile] = await Promise.all([
        fetchSchuelerAktuell(),
        fetchErzieherarten(),
        loadKataloge(),
        fetchOrtsteile().catch(() => []),
      ])

      const sMap = new Map<string, number[]>()
      const byId = new Map<number, SchuelerListeEintrag>()
      for (const s of schuelerList) {
        byId.set(s.id, s)
        const geb = s.geburtsdatum ? normalisiereDatum(s.geburtsdatum) : ''
        const key = lookupKey(s.nachname, s.vorname, geb)
        const ids = sMap.get(key) ?? []
        ids.push(s.id)
        sMap.set(key, ids)
      }
      schuelerMap.value = sMap
      schuelerById.value = byId

      const aMap = new Map<string, number>()
      for (const a of erzieherarten) if (a.bezeichnung) aMap.set(norm(a.bezeichnung), a.id)
      erzieherartenMap.value = aMap

      orteKatalog.value = kataloge.orte ?? new Map()
      nationalitaetenById.value = kataloge.nationalitaetenById ?? new Map()
      const otMap = new Map<string, number>()
      for (const ot of ortsteile) {
        if (ot.ortsteil && ot.idOrt !== null) otMap.set(`${ot.idOrt}|${norm(ot.ortsteil)}`, ot.id)
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

  /**
   * Liefert die Katalog-ID aus allinone.json (Nationalitaeten), die als idStaatsangehoerigkeit gesendet wird.
   * Akzeptiert die ID selbst (z. B. 68069085) sowie ISO-3-Code, DEStatis-Schlüssel und Bezeichnung.
   */
  function resolveStaatsangehoerigkeit(raw: string): number | null {
    const wert = raw.trim()
    if (/^\d{4,}$/.test(wert)) {
      const id = Number(wert)
      for (const v of nationalitaetenById.value.values()) if (v === id) return id
    }
    return resolveNationalitaetId(nationalitaetenById.value, wert)
  }

  /**
   * Zuordnung über die Schüler-ID, falls angegeben. Angegebene Namen/Geburtsdatum müssen zum
   * Schüler mit dieser ID passen, damit ein Tippfehler in der ID nicht unbemerkt bleibt.
   */
  function resolveById(row: SchuelerErzieherImportRow): void {
    const raw = row.schuelerId.trim()
    const s = /^\d+$/.test(raw) ? schuelerById.value.get(Number(raw)) : undefined
    if (!s) { row._lookupStatus = 'not_found'; row._schuelerId = null; return }
    const passt =
      (!row.nachname.trim()     || norm(row.nachname) === norm(s.nachname)) &&
      (!row.vorname.trim()      || norm(row.vorname)  === norm(s.vorname)) &&
      (!row.geburtsdatum.trim() || !s.geburtsdatum   || row.geburtsdatum.trim() === normalisiereDatum(s.geburtsdatum))
    row._lookupStatus = passt ? 'ok' : 'mismatch'
    row._schuelerId   = passt ? s.id : null
  }

  function resolveAndValidate(): void {
    for (const row of rows.value) {
      if (row._sent) continue
      if (lookupLoaded.value) {
        if (row.schuelerId.trim()) {
          resolveById(row)
        } else {
          const ids = schuelerMap.value.get(lookupKey(row.nachname, row.vorname, row.geburtsdatum))
          if (!ids || ids.length === 0) { row._lookupStatus = 'not_found'; row._schuelerId = null }
          else if (ids.length > 1)      { row._lookupStatus = 'ambiguous'; row._schuelerId = null }
          else                          { row._lookupStatus = 'ok';        row._schuelerId = ids[0] }
        }

        const art = norm(row.erzieherart)
        row._erzieherartStatus = !art ? 'empty' : erzieherartenMap.value.has(art) ? 'found' : 'new'

        if (!row.plz.trim() && !row.ort.trim()) row._wohnortStatus = 'empty'
        else row._wohnortStatus = resolveWohnort(row) !== null ? 'found' : 'not_found'
      }
      const errors: string[] = []
      const mitId = !!row.schuelerId.trim()
      // Mit Schüler-ID sind Name und Geburtsdatum optional (dienen nur der Gegenprüfung)
      if (!mitId) {
        if (!row.nachname.trim())     errors.push('Nachname des Schülers fehlt')
        if (!row.vorname.trim())      errors.push('Vorname des Schülers fehlt')
        if (!row.geburtsdatum.trim()) errors.push('Geburtsdatum des Schülers fehlt')
      }
      if (!row.nachname1.trim() && !row.vorname1.trim()) errors.push('Name der 1. Person fehlt')
      if (row._lookupStatus === 'not_found') errors.push(mitId
        ? `Schüler-ID ${row.schuelerId.trim()} nicht gefunden`
        : 'Schüler nicht gefunden')
      if (row._lookupStatus === 'mismatch')  errors.push(`Schüler-ID ${row.schuelerId.trim()} passt nicht zu Name/Geburtsdatum`)
      if (row._lookupStatus === 'ambiguous') errors.push('Schüler nicht eindeutig (mehrere Treffer)')
      if (row._lookupStatus === 'pending')   errors.push('Schüler noch nicht abgeglichen')
      // Unbekannte Staatsangehörigkeit nur melden, wenn der Katalog geladen ist
      if (nationalitaetenById.value.size > 0) {
        for (const [wert, person] of [[row.staatsangehoerigkeit1, '1. Person'], [row.staatsangehoerigkeit2, '2. Person']] as const) {
          if (wert.trim() && resolveStaatsangehoerigkeit(wert) === null)
            errors.push(`Staatsangehörigkeit „${wert.trim()}" (${person}) unbekannt`)
        }
      }
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

  async function uploadAll(
    selectedIds: Set<string> | undefined,
    modus: DuplikatModus,
  ): Promise<{ sent: number; updated: number; skipped: number; failed: number }> {
    const toSend = rows.value.filter(r =>
      r._valid && !r._sent && (selectedIds === undefined || selectedIds.has(r._id)),
    )
    uploading.value = true
    uploadProgress.value = 0
    uploadTotal.value = toSend.length
    uploadCancelled.value = false
    let sent = 0
    let updated = 0
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
      row._result = undefined
      row._valid = false
      failed++
      uploadProgress.value++
    }

    for (const row of toSend) {
      if (uploadCancelled.value) break
      if (!row._schuelerId) { fail(row, 'Schüler nicht zugeordnet'); continue }
      const idSchueler = row._schuelerId

      let vorhandene: ErzieherVorhanden[]
      try {
        vorhandene = modus === 'zusaetzlich' ? [] : await getVorhandene(idSchueler)
      } catch {
        fail(row, 'Vorhandene Erzieher konnten nicht geladen werden')
        continue
      }
      const findePerson = (nachname: string, vorname: string) =>
        vorhandene.find(e => norm(e.nachname) === norm(nachname) && norm(e.vorname) === norm(vorname))
      // Vorhanden = gleiche 1. Person ist beim Schüler bereits als Erzieher eingetragen
      const vorhanden = modus === 'zusaetzlich' ? undefined : findePerson(row.nachname1, row.vorname1)

      if (vorhanden && modus === 'ueberspringen') {
        row._errors = [`Erzieher „${row.vorname1} ${row.nachname1}" ist beim Schüler bereits vorhanden — übersprungen`]
        // Nicht als gesendet markieren: die Zeile kann später mit einem anderen Modus erneut gesendet werden
        row._result = 'uebersprungen'
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
      const person1 = erzieherPerson1Payload(row, {
        idSchueler, idErzieherArt, wohnortID, ortsteilID,
        idStaatsangehoerigkeit: resolveStaatsangehoerigkeit(row.staatsangehoerigkeit1),
      })
      const person2 = erzieherPerson2Payload(row, resolveStaatsangehoerigkeit(row.staatsangehoerigkeit2))

      if (vorhanden && modus === 'ueberschreiben') {
        const patched = await patchErzieher(vorhanden.id, ohneLeereFelder(person1))
        if (!patched.success) { fail(row, `Überschreiben fehlgeschlagen – ${patched.error}`); continue }
        if (hatZweitePerson(row)) {
          // 2. Person: vorhandene gleichnamige Person aktualisieren, sonst im Eintrag ergänzen
          const vorhanden2 = findePerson(row.nachname2, row.vorname2)
          const result2 = vorhanden2
            ? await patchErzieher(vorhanden2.id, ohneLeereFelder(person2))
            : await patchErzieherZweitePerson(vorhanden.id, person2)
          if (!result2.success) {
            row._errors = [`1. Person überschrieben, 2. Person fehlgeschlagen – ${result2.error}`]
            row._result = 'ueberschrieben'
            row._sent = true
            failed++
            uploadProgress.value++
            continue
          }
        }
        row._errors = []
        row._result = 'ueberschrieben'
        row._sent = true
        updated++
        uploadProgress.value++
        continue
      }

      const created = await createErzieher(idSchueler, person1)
      if (!created.success || created.id === undefined) {
        fail(row, `Anlegen fehlgeschlagen – ${created.error ?? 'keine ID erhalten'}`)
        continue
      }
      vorhandene.push({ id: created.id, nachname: row.nachname1, vorname: row.vorname1 })

      if (hatZweitePerson(row)) {
        const patched = await patchErzieherZweitePerson(created.id, person2)
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
    return { sent, updated, skipped, failed }
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
