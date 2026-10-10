import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSchuelerAktuell,
  fetchJahrgaenge,
  fetchLehrkraefte,
  fetchKlassenDetails,
  fetchKatalog,
  fetchLernabschnittsdaten,
  patchLernabschnittsdaten,
  createLernabschnittsdaten,
  buildJahrgaengeMap,
  buildKlassenMap,
  LERNABSCHNITT_ANLEGEN_UNTERSTUETZT,
  type FoerderschwerpunktEintrag,
  type LernabschnittVorhanden,
  type SchuelerListeEintrag,
  type VersetzungsvermerkEintrag,
} from '@/services/svwsService'
import {
  fetchLernabschnittAsdKataloge,
  resolveHistorisierteId,
  type HistorisierterKatalog,
  type LernabschnittAsdKataloge,
} from '@/services/katalogService'
import {
  type SchuelerLernabschnittImportRow,
  type LernabschnittIds,
  lernabschnittPatch,
  parseJaNein,
  parseGanzzahl,
} from '@/models/SchuelerLernabschnitt'
import { useSchuleStore } from '@/stores/schule'
import { normalisiereDatum } from '@/utils/csvParser'

function lookupKey(nachname: string, vorname: string, geburtsdatum: string): string {
  return `${nachname.toLowerCase().trim()}||${vorname.toLowerCase().trim()}||${geburtsdatum.trim()}`
}

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase()

/** Umgang mit Lernabschnitten, die beim Schüler im Schuljahresabschnitt bereits vorhanden sind */
export type LernabschnittDuplikatModus = 'ueberschreiben' | 'ueberspringen'

export interface LernabschnittUploadErgebnis {
  sent: number
  updated: number
  skipped: number
  missing: number
  failed: number
}

/** Ergebnis der Auflösung einer Zeile: IDs für den Patch und Fehler je Feld */
interface Aufloesung {
  ids: LernabschnittIds
  fehler: { feld: string; text: string }[]
}

export const useLernabschnitteStore = defineStore('lernabschnitte', () => {
  const schuleStore = useSchuleStore()

  const rows = ref<SchuelerLernabschnittImportRow[]>([])
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const uploadCancelled = ref(false)

  const schuelerMap = ref<Map<string, number[]>>(new Map())
  const schuelerById = ref<Map<number, SchuelerListeEintrag>>(new Map())
  /** Kürzel/Statistik-Kürzel (lowercase) → ID */
  const jahrgaengeMap = ref<Map<string, number>>(new Map())
  /** Lehrer-Kürzel (lowercase) → ID */
  const lehrerMap = ref<Map<string, number>>(new Map())
  /** Kürzel/Statistik-Kürzel (lowercase) → ID aus dem Förderschwerpunkt-Katalog der Schule */
  const foerderschwerpunkteMap = ref<Map<string, number>>(new Map())
  /** Kürzel der Versetzungsvermerke (Großschreibung); leer = Katalog nicht verfügbar, keine Prüfung */
  const versetzungsvermerke = ref<Set<string>>(new Set())
  const asdKataloge = ref<LernabschnittAsdKataloge | null>(null)
  /** ID des Schuljahresabschnitts → Klassen-Kürzel (lowercase) → ID */
  const klassenJeAbschnitt = ref<Map<number, Map<string, number>>>(new Map())
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
      if (!schuleStore.loaded || force) await schuleStore.fetch()
      const [schuelerList, jahrgaenge, lehrer, foerderschwerpunkte, vermerke, asd] = await Promise.all([
        fetchSchuelerAktuell(true),
        fetchJahrgaenge(),
        fetchLehrkraefte(),
        fetchKatalog('/foerderschwerpunkte') as Promise<FoerderschwerpunktEintrag[]>,
        (fetchKatalog('/schild3/versetzungsvermerke') as Promise<VersetzungsvermerkEintrag[]>).catch(() => []),
        fetchLernabschnittAsdKataloge(),
      ])

      const sMap = new Map<string, number[]>()
      const byId = new Map<number, SchuelerListeEintrag>()
      for (const s of schuelerList) {
        byId.set(s.id, s)
        const key = lookupKey(s.nachname, s.vorname, s.geburtsdatum ? normalisiereDatum(s.geburtsdatum) : '')
        sMap.set(key, [...(sMap.get(key) ?? []), s.id])
      }
      schuelerMap.value = sMap
      schuelerById.value = byId
      jahrgaengeMap.value = buildJahrgaengeMap(jahrgaenge)

      const lMap = new Map<string, number>()
      for (const l of lehrer) if (l.kuerzel) lMap.set(norm(l.kuerzel), l.id)
      lehrerMap.value = lMap

      const fMap = new Map<string, number>()
      for (const f of foerderschwerpunkte) {
        if (f.kuerzelStatistik) fMap.set(norm(f.kuerzelStatistik), f.id)
        if (f.kuerzel) fMap.set(norm(f.kuerzel), f.id)
      }
      foerderschwerpunkteMap.value = fMap

      versetzungsvermerke.value = new Set(vermerke.map(v => (v.Nr ?? '').trim().toUpperCase()).filter(Boolean))
      asdKataloge.value = asd
      klassenJeAbschnitt.value = new Map()
      lookupLoaded.value = true
      await ladeKlassen()
      return {}
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Schülerliste' }
    } finally {
      lookupLoading.value = false
    }
  }

  function findeAbschnittId(row: SchuelerLernabschnittImportRow): number | null {
    const jahr = Number(row.schuljahr)
    const nr = Number(row.abschnitt)
    return schuleStore.abschnitte.find(a => a.schuljahr === jahr && a.abschnitt === nr)?.id ?? null
  }

  /** Lädt die Klassen aller in den Zeilen vorkommenden, im Server bekannten Schuljahresabschnitte */
  async function ladeKlassen(): Promise<void> {
    if (!lookupLoaded.value) return
    const ids = new Set(rows.value.map(findeAbschnittId).filter((id): id is number => id !== null))
    for (const id of ids) {
      if (klassenJeAbschnitt.value.has(id)) continue
      try {
        klassenJeAbschnitt.value.set(id, buildKlassenMap(await fetchKlassenDetails(id)))
      } catch {
        klassenJeAbschnitt.value.set(id, new Map())
      }
    }
  }

  /**
   * Zuordnung über die Schüler-ID, falls angegeben. Angegebene Namen/Geburtsdatum müssen zum
   * Schüler mit dieser ID passen, damit ein Tippfehler in der ID nicht unbemerkt bleibt.
   */
  function resolveSchueler(row: SchuelerLernabschnittImportRow): void {
    const raw = row.schuelerId.trim()
    if (raw) {
      const s = /^\d+$/.test(raw) ? schuelerById.value.get(Number(raw)) : undefined
      if (!s) { row._lookupStatus = 'not_found'; row._schuelerId = null; return }
      const passt =
        (!row.nachname.trim()     || norm(row.nachname) === norm(s.nachname)) &&
        (!row.vorname.trim()      || norm(row.vorname)  === norm(s.vorname)) &&
        (!row.geburtsdatum.trim() || !s.geburtsdatum   || row.geburtsdatum.trim() === normalisiereDatum(s.geburtsdatum))
      row._lookupStatus = passt ? 'ok' : 'mismatch'
      row._schuelerId   = passt ? s.id : null
      return
    }
    const ids = schuelerMap.value.get(lookupKey(row.nachname, row.vorname, row.geburtsdatum))
    if (!ids || ids.length === 0) { row._lookupStatus = 'not_found'; row._schuelerId = null }
    else if (ids.length > 1)      { row._lookupStatus = 'ambiguous'; row._schuelerId = null }
    else                          { row._lookupStatus = 'ok';        row._schuelerId = ids[0] }
  }

  function organisationsformKatalog(): HistorisierterKatalog | undefined {
    if (schuleStore.schulform === 'BK') return asdKataloge.value?.organisationsformenBK
    if (schuleStore.schulform === 'WB') return asdKataloge.value?.organisationsformenWB
    return asdKataloge.value?.organisationsformenAllgemein
  }

  /** Löst die Katalogwerte einer Zeile auf; nur sinnvoll, wenn die Kataloge geladen sind */
  function loese(row: SchuelerLernabschnittImportRow): Aufloesung {
    const ids: LernabschnittIds = {}
    const fehler: Aufloesung['fehler'] = []
    const schuljahr = Number(row.schuljahr)

    const perMap = (wert: string, map: Map<string, number>, feld: string, label: string, ziel: keyof LernabschnittIds) => {
      if (!wert.trim()) return
      const id = map.get(norm(wert))
      if (id === undefined) fehler.push({ feld, text: `${label} „${wert.trim()}" unbekannt` })
      else ids[ziel] = id
    }
    const perAsd = (wert: string, katalog: HistorisierterKatalog | undefined, feld: string, label: string, ziel: keyof LernabschnittIds) => {
      if (!wert.trim() || !katalog) return
      const id = resolveHistorisierteId(katalog, wert, schuljahr)
      if (id === null) fehler.push({ feld, text: `${label} „${wert.trim()}" ist im Schuljahr ${schuljahr} nicht gültig` })
      else ids[ziel] = id
    }

    perMap(row.jahrgang, jahrgaengeMap.value, 'jahrgang', 'Jahrgang', 'jahrgangID')
    if (row.klasse.trim() && row._idSchuljahresabschnitt !== null) {
      perMap(row.klasse, klassenJeAbschnitt.value.get(row._idSchuljahresabschnitt) ?? new Map(), 'klasse', 'Klasse', 'klassenID')
    }
    perMap(row.tutor, lehrerMap.value, 'tutor', 'Lehrkraft', 'tutorID')
    perAsd(row.schulgliederung, asdKataloge.value?.schulgliederungen, 'schulgliederung', 'Schulgliederung', 'idSchulgliederung')
    perAsd(row.organisationsform, organisationsformKatalog(), 'organisationsform', 'Organisationsform', 'idOrganisationsform')
    perAsd(row.klassenart, asdKataloge.value?.klassenarten, 'klassenart', 'Klassenart', 'idKlassenart')
    perMap(row.foerderschwerpunkt1, foerderschwerpunkteMap.value, 'foerderschwerpunkt1', 'Förderschwerpunkt', 'foerderschwerpunkt1ID')
    perMap(row.foerderschwerpunkt2, foerderschwerpunkteMap.value, 'foerderschwerpunkt2', '2. Förderschwerpunkt', 'foerderschwerpunkt2ID')

    const vermerk = row.versetzung.trim().toUpperCase()
    if (vermerk && versetzungsvermerke.value.size > 0 && !versetzungsvermerke.value.has(vermerk)) {
      fehler.push({ feld: 'versetzung', text: `Versetzungsvermerk „${row.versetzung.trim()}" unbekannt` })
    }
    return { ids, fehler }
  }

  /** Formatprüfungen, die keine Kataloge brauchen */
  function pruefeFormate(row: SchuelerLernabschnittImportRow, fehler: Aufloesung['fehler']): void {
    for (const [feld, label] of [['gewertet', 'Gewertet'], ['wiederholung', 'Wiederholung'], ['schwerbehinderung', 'Schwerbehinderung']] as const) {
      if (row[feld].trim() && parseJaNein(row[feld]) === null) fehler.push({ feld, text: `${label}: „${row[feld]}" ist kein J/N-Wert` })
    }
    for (const [feld, label] of [
      ['fehlstundenGesamt', 'Fehlstunden'], ['fehlstundenUnentschuldigt', 'Unentschuldigte Fehlstunden'],
      ['fehlstundenGrenzwert', 'Fehlstunden-Grenzwert'], ['abschlussart', 'Abschlussart'], ['wechselNr', 'WechselNr'],
    ] as const) {
      if (row[feld].trim() && parseGanzzahl(row[feld]) === null) fehler.push({ feld, text: `${label}: „${row[feld]}" ist keine ganze Zahl` })
    }
    for (const [feld, label] of [
      ['datumKonferenz', 'Konferenzdatum'], ['datumZeugnis', 'Zeugnisdatum'], ['datumAnfang', 'Datum von'], ['datumEnde', 'Datum bis'],
    ] as const) {
      if (row[feld].trim() && !/^\d{4}-\d{2}-\d{2}$/.test(row[feld].trim())) fehler.push({ feld, text: `${label}: „${row[feld]}" ist kein gültiges Datum` })
    }
    if (row.zeugnisart.trim().length > 5) fehler.push({ feld: 'zeugnisart', text: 'Zeugnisart: höchstens 5 Zeichen' })
  }

  function resolveAndValidate(): void {
    const gesehen = new Set<string>()
    for (const row of rows.value) {
      if (row._sent) continue
      const fehler: Aufloesung['fehler'] = []
      const mitId = !!row.schuelerId.trim()
      // Mit Schüler-ID sind Name und Geburtsdatum optional (dienen nur der Gegenprüfung)
      if (!mitId) {
        if (!row.nachname.trim())     fehler.push({ feld: 'nachname', text: 'Nachname des Schülers fehlt' })
        if (!row.vorname.trim())      fehler.push({ feld: 'vorname', text: 'Vorname des Schülers fehlt' })
        if (!row.geburtsdatum.trim()) fehler.push({ feld: 'geburtsdatum', text: 'Geburtsdatum des Schülers fehlt' })
      }
      if (!/^\d{4}$/.test(row.schuljahr.trim())) fehler.push({ feld: 'schuljahr', text: 'Schuljahr fehlt oder ist ungültig (z. B. 2025)' })
      if (!/^\d+$/.test(row.abschnitt.trim()))   fehler.push({ feld: 'abschnitt', text: 'Abschnitt fehlt oder ist ungültig (z. B. 1)' })

      row._idSchuljahresabschnitt = findeAbschnittId(row)
      if (lookupLoaded.value) {
        resolveSchueler(row)
        if (row._lookupStatus === 'not_found') fehler.push({ feld: 'schuelerId', text: mitId ? `Schüler-ID ${row.schuelerId.trim()} nicht gefunden` : 'Schüler nicht gefunden' })
        if (row._lookupStatus === 'mismatch')  fehler.push({ feld: 'schuelerId', text: `Schüler-ID ${row.schuelerId.trim()} passt nicht zu Name/Geburtsdatum` })
        if (row._lookupStatus === 'ambiguous') fehler.push({ feld: 'nachname', text: 'Schüler nicht eindeutig (mehrere Treffer)' })
        // Neue Schuljahresabschnitte können noch nicht angelegt werden
        if (row._idSchuljahresabschnitt === null && row.schuljahr.trim() && row.abschnitt.trim()) {
          fehler.push({ feld: 'abschnitt', text: `Schuljahresabschnitt ${row.schuljahr.trim()}/${row.abschnitt.trim()} ist im SVWS-Server nicht vorhanden` })
        }
        fehler.push(...loese(row).fehler)
      } else {
        fehler.push({ feld: 'nachname', text: 'Schüler noch nicht abgeglichen' })
      }
      pruefeFormate(row, fehler)

      // Ohne WechselNr kann je Schüler und Abschnitt nur eine Zeile zugeordnet werden
      if (row._schuelerId !== null && row._idSchuljahresabschnitt !== null) {
        const key = `${row._schuelerId}|${row._idSchuljahresabschnitt}|${parseGanzzahl(row.wechselNr) ?? 0}`
        if (gesehen.has(key)) fehler.push({ feld: 'wechselNr', text: 'Doppelte Zeile für Schüler und Abschnitt – ggf. Spalte WechselNr angeben' })
        gesehen.add(key)
      }

      row._errors = fehler.map(f => f.text)
      row._fehlerFelder = [...new Set(fehler.map(f => f.feld))]
      row._valid = fehler.length === 0
    }
  }

  async function setRows(newRows: SchuelerLernabschnittImportRow[]): Promise<void> {
    rows.value = newRows
    await ladeKlassen()
    resolveAndValidate()
  }

  async function updateRow(id: string, changes: Partial<SchuelerLernabschnittImportRow>): Promise<void> {
    const row = rows.value.find(r => r._id === id)
    if (!row) return
    Object.assign(row, changes)
    // In der Tabelle eingegebene Daten (TT.MM.JJJJ) wie beim Einlesen ins ISO-Format bringen
    for (const feld of ['geburtsdatum', 'datumKonferenz', 'datumZeugnis', 'datumAnfang', 'datumEnde'] as const) {
      if (feld in changes) row[feld] = normalisiereDatum(row[feld].trim())
    }
    if ('schuljahr' in changes || 'abschnitt' in changes) await ladeKlassen()
    resolveAndValidate()
  }

  function deleteRow(id: string): void {
    rows.value = rows.value.filter(r => r._id !== id)
    resolveAndValidate()
  }

  function clear(): void {
    rows.value = []
  }

  async function uploadAll(
    selectedIds: Set<string> | undefined,
    modus: LernabschnittDuplikatModus,
  ): Promise<LernabschnittUploadErgebnis> {
    const toSend = rows.value.filter(r =>
      r._valid && !r._sent && (selectedIds === undefined || selectedIds.has(r._id)),
    )
    uploading.value = true
    uploadProgress.value = 0
    uploadTotal.value = toSend.length
    uploadCancelled.value = false
    const ergebnis: LernabschnittUploadErgebnis = { sent: 0, updated: 0, skipped: 0, missing: 0, failed: 0 }

    const fail = (row: SchuelerLernabschnittImportRow, msg: string) => {
      row._errors = [msg]
      row._result = undefined
      row._valid = false
      ergebnis.failed++
    }

    for (const row of toSend) {
      if (uploadCancelled.value) break
      uploadProgress.value++
      const idSchueler = row._schuelerId
      const idAbschnitt = row._idSchuljahresabschnitt
      if (idSchueler === null || idAbschnitt === null) { fail(row, 'Schüler oder Schuljahresabschnitt nicht zugeordnet'); continue }

      let vorhandene: LernabschnittVorhanden[]
      try {
        vorhandene = await fetchLernabschnittsdaten(idSchueler, idAbschnitt)
      } catch (e) {
        fail(row, `Vorhandene Lernabschnitte konnten nicht geladen werden: ${e instanceof Error ? e.message : ''}`)
        continue
      }
      const wechselNr = parseGanzzahl(row.wechselNr) ?? 0
      const vorhanden = vorhandene.find(la => la.wechselNr === wechselNr)
      const patch = lernabschnittPatch(row, loese(row).ids)

      if (vorhanden) {
        if (modus === 'ueberspringen') {
          // Nicht als gesendet markieren: die Zeile kann später mit dem anderen Modus erneut gesendet werden
          row._errors = ['Lernabschnitt ist beim Schüler bereits vorhanden — übersprungen']
          row._result = 'uebersprungen'
          ergebnis.skipped++
          continue
        }
        const result = await patchLernabschnittsdaten(vorhanden.id, patch)
        if (!result.success) { fail(row, `Überschreiben fehlgeschlagen – ${result.error}`); continue }
        row._errors = []
        row._result = 'ueberschrieben'
        row._sent = true
        ergebnis.updated++
        continue
      }

      if (!LERNABSCHNITT_ANLEGEN_UNTERSTUETZT) {
        // Bleibt sendbar, damit die Zeile nach einem Server-Update erneut gesendet werden kann
        row._errors = ['Lernabschnitt beim Schüler nicht vorhanden – das Anlegen unterstützt der SVWS-Server noch nicht']
        row._result = 'fehlt'
        ergebnis.missing++
        continue
      }
      const created = await createLernabschnittsdaten(idSchueler, idAbschnitt, { wechselNr, ...patch })
      if (!created.success) { fail(row, `Anlegen fehlgeschlagen – ${created.error}`); continue }
      row._errors = []
      row._result = 'angelegt'
      row._sent = true
      ergebnis.sent++
    }

    uploading.value = false
    return ergebnis
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
  import.meta.hot.accept(acceptHMRUpdate(useLernabschnitteStore, import.meta.hot))
}
