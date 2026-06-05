<template>
  <div :class="['table-view', { 'is-dark': isDark }]">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="table-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          size="small"
          text
          rounded
          @click="router.push({ name: 'import' })"
          aria-label="Zurück"
        />
        <h2>Unterricht</h2>
        <Select
          v-if="schuleStore.loaded"
          v-model="idSchuljahresabschnitt"
          :options="schuleStore.abschnitteOptions"
          optionLabel="label"
          optionValue="id"
          placeholder="Abschnitt wählen"
          size="small"
          style="width: 160px"
        />
        <InputNumber
          v-else
          v-model="idSchuljahresabschnitt"
          :min="1"
          size="small"
          style="width: 100px"
        />
      </div>
    </div>

    <Message v-if="parseError" severity="error" :closable="true" @close="parseError = ''">
      {{ parseError }}
    </Message>

    <!-- ── Tabs ────────────────────────────────────────────────────────── -->
    <Tabs v-model:value="activeTab" class="unterricht-tabs">
      <TabList>
        <Tab value="klasse">
          Klassenunterricht
          <Badge v-if="klasseRows.length > 0" :value="klasseRows.length" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="kurs">
          Kursunterricht
          <Badge v-if="kursRows.length > 0" :value="kursRows.length" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="schueler">
          Schülerunterricht
          <Badge v-if="schuelerRows.length > 0" :value="schuelerRows.length" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="zuweisung">Kurszuweisung</Tab>
      </TabList>

      <TabPanels>

        <!-- ══ Tab 1: Klassenunterricht ══════════════════════════════════ -->
        <TabPanel value="klasse">
          <div class="tab-content">
            <div class="tab-actions">
              <FileUpload
                :key="klasseFileKey"
                mode="basic" :auto="false" :multiple="false"
                accept=".csv,.dat,.xlsx"
                chooseLabel="Datei laden" chooseIcon="pi pi-folder-open"
                :maxFileSize="10000000" :disabled="parsingKlasse"
                @select="onKlasseFileSelect"
              />
              <Button label="Importieren" icon="pi pi-upload" size="small"
                :disabled="klasseRows.filter(r => r._valid && !r._sent).length === 0 || klasseImport.running"
                @click="handleKlasseImport" />
              <Button v-if="klasseRows.length > 0" label="Leeren" icon="pi pi-trash"
                severity="danger" size="small" text :disabled="klasseImport.running"
                @click="klasseRows = []; klasseFileKey++" />
              <span v-if="loadingKlasseLookups" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" /> Prüfe Referenzen…
              </span>
              <span v-if="klasseImport.running" class="lookup-loading">
                <i class="pi pi-spin pi-spinner" />
                {{ klasseImport.done }}&nbsp;/&nbsp;{{ klasseImport.total }} Einträge…
              </span>
              <span v-if="!klasseImport.running && klasseImport.total > 0" class="import-result">
                {{ klasseImport.done - klasseImport.errors }} importiert
                <span v-if="klasseImport.errors > 0" style="color:#ef4444">
                  · {{ klasseImport.errors }} Fehler
                </span>
              </span>
            </div>

            <Message
              v-if="klasseWarnCount > 0 && !loadingKlasseLookups"
              severity="warn"
              :closable="false"
            >
              {{ klasseWarnCount }} Zeile(n) mit nicht aufgelösten Referenzen
              (Abschnitt, Klasse, Lehrer oder Fach nicht gefunden).
              Bitte die markierten Zeilen prüfen — orangene ⚠ Felder anklicken für Details.
            </Message>

            <div v-if="klasseRows.length === 0" :class="['hint-box', { 'hint-box--dark': isDark }]">
              <i class="pi pi-info-circle" />
              <div>
                <strong>Klassenunterricht</strong> — weist allen Schülern einer Klasse
                Unterrichtsfächer zu. Format: Klassen-CSV mit Spalten
                <em>Schuljahr&nbsp;|&nbsp;Abschnitt&nbsp;|&nbsp;Klasse&nbsp;|&nbsp;LehrerKuerzel&nbsp;|&nbsp;Kursart&nbsp;|&nbsp;Fach&nbsp;|&nbsp;Wochenstunden</em>.
                Trennzeichen: Semikolon, Komma oder Pipe.
                Nach dem Laden werden Abschnitt, Klasse, Lehrer und Fach automatisch gegen die Datenbank geprüft.
              </div>
            </div>
            <ag-grid-vue
              v-if="klasseRows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="klasseRows" :columnDefs="klasseColDefs" :defaultColDef="defaultColDef"
              :rowClassRules="rowClassRules" :getRowId="getRowId" :animateRows="true"
              rowSelection="multiple"
              @grid-ready="onKlasseGridReady"
              @selection-changed="onKlasseSelectionChanged"
            />
          </div>
        </TabPanel>

        <!-- ══ Tab 2: Kursunterricht (Kurse anlegen) ══════════════════════ -->
        <TabPanel value="kurs">
          <div class="tab-content">
            <div class="tab-actions">
              <Select
                v-model="kursFormat"
                :options="kursFormats"
                optionLabel="label"
                optionValue="value"
                size="small"
                style="width: 240px"
              />
              <FileUpload
                mode="basic" :auto="false" :multiple="false"
                accept=".csv,.dat,.xlsx"
                chooseLabel="Datei laden" chooseIcon="pi pi-folder-open"
                :maxFileSize="10000000" :disabled="parsingKurs"
                @select="onKursFileSelect"
              />
              <Button label="Kurse anlegen" icon="pi pi-upload" size="small"
                :disabled="kursRows.filter(r => r._valid && !r._sent).length === 0"
                @click="handleKursImport" />
              <Button v-if="kursRows.length > 0" label="Leeren" icon="pi pi-trash"
                severity="danger" size="small" text @click="kursRows = []" />
            </div>
            <div v-if="kursRows.length === 0" :class="['hint-box', { 'hint-box--dark': isDark }]">
              <i class="pi pi-info-circle" />
              <div>
                <strong>Kursunterricht</strong> — legt neue Kurse in der Datenbank an
                (Fach, Kursart, Kursnummer, Lehrer). Schüler werden im Tab
                <em>Schülerunterricht</em> zugewiesen.
                Unterstützte Formate: Kurse-CSV
                (Spalten: Fach&nbsp;|&nbsp;Kursart&nbsp;|&nbsp;Kursnummer&nbsp;|&nbsp;Lehrer&nbsp;|&nbsp;Std./Wo.).
              </div>
            </div>
            <ag-grid-vue
              v-if="kursRows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="kursRows" :columnDefs="kursColDefs" :defaultColDef="defaultColDef"
              :rowClassRules="rowClassRules" :getRowId="getRowId" :animateRows="true"
            />
          </div>
        </TabPanel>

        <!-- ══ Tab 3: Schülerunterricht ══════════════════════════════════ -->
        <TabPanel value="schueler">
          <div class="tab-content">
            <div class="tab-actions">
              <Select
                v-model="schuelerFormat"
                :options="schuelerFormats"
                optionLabel="label"
                optionValue="value"
                size="small"
                style="width: 300px"
              />
              <FileUpload
                mode="basic" :auto="false" :multiple="false"
                accept=".csv,.dat,.xlsx"
                chooseLabel="Datei laden" chooseIcon="pi pi-folder-open"
                :maxFileSize="10000000" :disabled="parsingSchueler"
                @select="onSchuelerFileSelect"
              />
              <Button label="Importieren" icon="pi pi-upload" size="small"
                :disabled="schuelerRows.filter(r => r._valid && !r._sent).length === 0"
                @click="handleSchuelerImport" />
              <Button v-if="schuelerRows.length > 0" label="Leeren" icon="pi pi-trash"
                severity="danger" size="small" text @click="schuelerRows = []" />
            </div>
            <div v-if="schuelerRows.length === 0" :class="['hint-box', { 'hint-box--dark': isDark }]">
              <i class="pi pi-info-circle" />
              <div>
                <strong>Schülerunterricht</strong> — weist einzelnen Schülern Unterricht zu
                (sowohl für Klassen- als auch Kursunterricht).
                Unterstützt: <em>Schüler-Leistungsdaten (.dat)</em> — ein Eintrag je Schüler und Fach.
              </div>
            </div>
            <ag-grid-vue
              v-if="schuelerRows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="schuelerRows" :columnDefs="schuelerColDefs" :defaultColDef="defaultColDef"
              :rowClassRules="rowClassRules" :getRowId="getRowId" :animateRows="true"
            />
          </div>
        </TabPanel>

        <!-- ══ Tab 4: Kurszuweisung (Drag & Drop) ════════════════════════ -->
        <TabPanel value="zuweisung">
          <div class="zuweisung-root">

            <!-- Filter-Leiste -->
            <div class="zuweisung-toolbar">
              <div class="toolbar-group">
                <span class="toolbar-label">Kurse</span>
                <InputText v-model="kursSearch" placeholder="Fach suchen…" size="small" />
                <Select
                  v-model="kursartFilter"
                  :options="availableKursarten"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  style="width: 130px"
                />
                <Button
                  label="Laden"
                  icon="pi pi-refresh"
                  size="small"
                  severity="secondary"
                  outlined
                  :loading="loadingKurse"
                  @click="loadKurse"
                />
              </div>
              <div class="toolbar-sep" />
              <div class="toolbar-group">
                <span class="toolbar-label">Schüler</span>
                <InputText v-model="schuelerSearch" placeholder="Name suchen…" size="small" />
                <Select
                  v-model="klasseFilter"
                  :options="availableKlassen"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                  style="width: 130px"
                />
                <Button
                  label="Laden"
                  icon="pi pi-refresh"
                  size="small"
                  severity="secondary"
                  outlined
                  :loading="loadingSchueler"
                  @click="loadSchueler"
                />
              </div>
              <div class="toolbar-sep" />
              <Button
                v-if="pendingAssignments > 0"
                :label="`${pendingAssignments} Zuweisung(en) speichern`"
                icon="pi pi-save"
                size="small"
                @click="saveAssignments"
              />
            </div>

            <!-- Zwei-Spalten-Layout -->
            <div class="zuweisung-layout">

              <!-- ── Linke Spalte: Kursliste ───────────────────────── -->
              <div class="panel kurs-panel">
                <div class="panel-header">
                  <span class="panel-title">Kurse</span>
                  <span class="panel-count">{{ filteredKurse.length }}</span>
                </div>

                <div v-if="dbKurse.length === 0" class="panel-empty">
                  <i class="pi pi-list" />
                  <span>Kurse über „Laden" aus der Datenbank holen</span>
                </div>

                <div v-else class="kurs-list">
                  <div
                    v-for="kurs in filteredKurse"
                    :key="kurs.id"
                    :class="['kurs-item', { 'kurs-item--selected': kurs.id === selectedKursId }]"
                    @click="selectedKursId = kurs.id"
                  >
                    <div class="kurs-item-main">
                      <span class="kurs-fach">{{ kurs.fach }}</span>
                      <span class="kurs-meta">{{ kurs.kursart }}&nbsp;{{ kurs.kursnummer }}</span>
                    </div>
                    <div class="kurs-item-right">
                      <span v-if="kurs.lehrer" class="kurs-lehrer">{{ kurs.lehrer }}</span>
                      <span class="kurs-count-badge">
                        {{ (assignments[kurs.id] ?? []).length }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Rechte Spalte: Schüler-Zuweisung ─────────────── -->
              <div class="panel schueler-panel">

                <!-- Pool: Nicht zugewiesen -->
                <div class="schueler-section">
                  <div class="panel-header">
                    <span class="panel-title">Verfügbare Schüler</span>
                    <span class="panel-count">{{ filteredPool.length }}</span>
                  </div>
                  <div
                    class="drop-zone"
                    :class="{
                      'drop-zone--over': dragOverZone === 'pool',
                      'drop-zone--empty': filteredPool.length === 0,
                    }"
                    @dragover.prevent="dragOverZone = 'pool'"
                    @dragleave="dragOverZone = null"
                    @drop.prevent="onDropToPool"
                  >
                    <div v-if="dbSchueler.length === 0" class="panel-empty">
                      <i class="pi pi-users" />
                      <span>Schüler über „Laden" aus der Datenbank holen</span>
                    </div>
                    <div v-else-if="filteredPool.length === 0 && selectedKursId" class="drop-hint">
                      Alle gefilterten Schüler sind diesem Kurs zugewiesen
                    </div>
                    <div v-else-if="filteredPool.length === 0" class="drop-hint">
                      Kein Schüler entspricht dem Filter
                    </div>
                    <div
                      v-for="s in filteredPool"
                      :key="s.id"
                      class="schueler-card"
                      draggable="true"
                      @dragstart="onDragStart($event, s.id)"
                      @dragend="onDragEnd"
                    >
                      <span class="schueler-name">{{ s.nachname }},&nbsp;{{ s.vorname }}</span>
                      <span class="klasse-tag">{{ s.klasse }}</span>
                    </div>
                  </div>
                </div>

                <!-- Zugewiesen zu gewähltem Kurs -->
                <div class="schueler-section" :class="{ 'schueler-section--inactive': !selectedKursId }">
                  <div class="panel-header">
                    <span class="panel-title">
                      {{ selectedKursId ? `Zugewiesen: ${selectedKursLabel}` : 'Zuerst Kurs wählen' }}
                    </span>
                    <span v-if="selectedKursId" class="panel-count">{{ filteredAssigned.length }}</span>
                  </div>
                  <div
                    class="drop-zone drop-zone--target"
                    :class="{
                      'drop-zone--over': dragOverZone === 'assigned',
                      'drop-zone--disabled': !selectedKursId,
                    }"
                    @dragover.prevent="selectedKursId && (dragOverZone = 'assigned')"
                    @dragleave="dragOverZone = null"
                    @drop.prevent="onDropToAssigned"
                  >
                    <div v-if="!selectedKursId" class="drop-hint drop-hint--muted">
                      Kurs in der linken Liste anklicken, dann Schüler hierhin ziehen
                    </div>
                    <div v-else-if="filteredAssigned.length === 0" class="drop-hint">
                      Schüler aus der Liste oben hierhin ziehen
                    </div>
                    <div
                      v-for="s in filteredAssigned"
                      :key="s.id"
                      class="schueler-card schueler-card--assigned"
                      draggable="true"
                      @dragstart="onDragStart($event, s.id)"
                      @dragend="onDragEnd"
                    >
                      <span class="schueler-name">{{ s.nachname }},&nbsp;{{ s.vorname }}</span>
                      <span class="klasse-tag">{{ s.klasse }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </TabPanel>

      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, type ColDef, type GetRowIdParams, type GridApi } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Badge from 'primevue/badge'
import { useSchuleStore } from '@/stores/schule'
import { useDarkMode } from '@/composables/useDarkMode'
import {
  fetchLehrkraefte, fetchFaecher, fetchKlassenDetails,
  fetchSchuelerAuswahlliste, fetchLernabschnittId, createLeistungsdaten,
  type LehrkraftListEntry,
} from '@/services/svwsService'
import { fetchKursartenForSchulform } from '@/services/katalogService'
import type { KlasseDetails } from '@/models/Klassen'
import type { FachDetails } from '@/models/Faecher'

ModuleRegistry.registerModules([ClientSideRowModelModule])

// ── Typen ─────────────────────────────────────────────────────────────────

interface BaseRow {
  _id: string
  _valid: boolean
  _errors: string[]
  _sent: boolean
}

interface KlassenunterrichtRow extends BaseRow {
  schuljahr: string
  abschnitt: string
  klasse: string
  lehrerKuerzel: string
  kursart: string
  fach: string
  wochenstunden: string
  aufsZeugnis: string
  // aufgelöste IDs
  idSchuljahresabschnitt: number | null
  idKlasse: number | null
  idLehrer: number | null
  idFach: number | null
  _kursartOk: boolean
}

interface KursRow extends BaseRow {
  fach: string
  kursart: string
  kursnummer: string
  fachlehrer: string
  wochenstunden: string
}

interface SchuelerUnterrichtRow extends BaseRow {
  nachname: string
  vorname: string
  geburtsdatum: string
  jahr: string
  abschnitt: string
  fach: string
  fachlehrer: string
  kursart: string
  kurs: string
  note: string
  wochenstunden: string
  jahrgang: string
}

interface DbKurs {
  id: number
  fach: string
  kursart: string
  kursnummer: number
  lehrer: string
}

interface DbSchueler {
  id: number
  nachname: string
  vorname: string
  klasse: string
}

// ── Stores & Composables ──────────────────────────────────────────────────

const router = useRouter()
const schuleStore = useSchuleStore()
const { isDark } = useDarkMode()

// ── Schuljahresabschnitt ──────────────────────────────────────────────────

const idSchuljahresabschnitt = ref<number | null>(null)

onMounted(() => {
  if (schuleStore.loaded) {
    idSchuljahresabschnitt.value =
      schuleStore.aktuellerAbschnittId ?? schuleStore.abschnitteOptions[0]?.id ?? null
  }
})

// ── Tab-State ─────────────────────────────────────────────────────────────

const activeTab = ref<'klasse' | 'kurs' | 'schueler' | 'zuweisung'>('klasse')
const parseError = ref('')

// ── Tab 1: Klassenunterricht ──────────────────────────────────────────────

const klasseRows = ref<KlassenunterrichtRow[]>([])
const parsingKlasse = ref(false)
const loadingKlasseLookups = ref(false)
const klasseFileKey = ref(0)

const cachedLehrkraefte = ref<LehrkraftListEntry[]>([])
const cachedFaecher = ref<FachDetails[]>([])
const cachedKlassenByAbschnitt = ref<Record<number, KlasseDetails[]>>({})
const cachedKursarten = ref<Set<string>>(new Set())

const klasseWarnCount = computed(() => klasseRows.value.filter(r => !r._valid && !r._sent).length)
const klasseImport = ref({ running: false, total: 0, done: 0, errors: 0 })
const klasseGridApi = ref<GridApi<KlassenunterrichtRow> | null>(null)
const klasseSelectedCount = ref(0)

function onKlasseGridReady(params: { api: GridApi<KlassenunterrichtRow> }): void {
  klasseGridApi.value = params.api
}

function onKlasseSelectionChanged(): void {
  klasseSelectedCount.value = klasseGridApi.value?.getSelectedRows().length ?? 0
}

async function onKlasseFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsingKlasse.value = true
  parseError.value = ''
  try {
    klasseRows.value = await parseKlassenunterrichtCsv(file)
    await loadKlassenunterrichtLookups(klasseRows.value)
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen'
  } finally {
    parsingKlasse.value = false
  }
}

function parseCsvLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === sep && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

async function parseKlassenunterrichtCsv(file: File): Promise<KlassenunterrichtRow[]> {
  const text = await file.text()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('Keine Datenzeilen gefunden')
  const sep = lines[0].includes(';') ? ';' : lines[0].includes('|') ? '|' : ','
  const header = parseCsvLine(lines[0], sep).map(h => h.toLowerCase())
  const col = (names: string[]) => names.reduce((found, n) => found !== -1 ? found : header.indexOf(n), -1)

  const rows: KlassenunterrichtRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i], sep)
    const get = (names: string[]) => (c[col(names)] ?? '').trim()
    rows.push({
      _id: crypto.randomUUID(),
      _valid: true,
      _errors: [],
      _sent: false,
      schuljahr:     get(['schuljahr', 'jahr']),
      abschnitt:     get(['abschnitt']),
      klasse:        get(['klasse']),
      lehrerKuerzel: get(['lehrerkuerzel', 'lehrer', 'fachlehrer']),
      kursart:       get(['kursart']),
      fach:          get(['fach']),
      wochenstunden: get(['wochenstunden', 'wochenstd.']),
      aufsZeugnis:   get(['aufszerugnis', 'aufszeugnis', 'aufszeugnis']),
      idSchuljahresabschnitt: null,
      idKlasse: null,
      idLehrer: null,
      idFach: null,
      _kursartOk: false,
    })
  }
  if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
  return rows
}

async function loadKlassenunterrichtLookups(_rows: KlassenunterrichtRow[]): Promise<void> {
  loadingKlasseLookups.value = true
  try {
    const schulform = schuleStore.schulform ?? ''
    const [lehrkraefte, faecher, kursarten] = await Promise.all([
      fetchLehrkraefte(),
      fetchFaecher(),
      schulform ? fetchKursartenForSchulform(schulform) : Promise.resolve(new Set<string>()),
    ])
    cachedLehrkraefte.value = lehrkraefte
    cachedFaecher.value = faecher
    cachedKursarten.value = kursarten

    // Klassen für den gewählten Abschnitt laden (nicht aus CSV ableiten)
    const selectedId = idSchuljahresabschnitt.value
    if (selectedId !== null && !cachedKlassenByAbschnitt.value[selectedId]) {
      const klassen = await fetchKlassenDetails(selectedId)
      cachedKlassenByAbschnitt.value = { ...cachedKlassenByAbschnitt.value, [selectedId]: klassen }
    }

    resolveKlasseRows()
    klasseRows.value = [...klasseRows.value]
  } finally {
    loadingKlasseLookups.value = false
  }
}

function resolveKlasseRows(): void {
  const selectedId = idSchuljahresabschnitt.value
  const selectedSja = selectedId !== null
    ? schuleStore.abschnitte.find(a => a.id === selectedId)
    : null
  const klassen = selectedId !== null ? (cachedKlassenByAbschnitt.value[selectedId] ?? []) : []

  for (const row of klasseRows.value) {
    row._errors = []

    // Abschnitt: immer der gewählte — nur Plausibilitätswarnung wenn CSV-Wert abweicht
    row.idSchuljahresabschnitt = selectedId
    if (selectedId === null) {
      row._errors.push('Kein Schuljahresabschnitt ausgewählt')
    } else if (selectedSja && row.schuljahr && row.abschnitt) {
      const csvMismatch =
        String(selectedSja.schuljahr) !== row.schuljahr ||
        String(selectedSja.abschnitt) !== row.abschnitt
      if (csvMismatch)
        row._errors.push(
          `CSV-Abschnitt ${row.schuljahr}/${row.abschnitt} weicht vom gewählten Abschnitt ab`,
        )
    }

    const lehrer = cachedLehrkraefte.value.find(
      l => l.kuerzel.toLowerCase() === row.lehrerKuerzel.toLowerCase(),
    )
    row.idLehrer = lehrer?.id ?? null
    if (!lehrer && row.lehrerKuerzel)
      row._errors.push(`Lehrer „${row.lehrerKuerzel}" nicht gefunden`)

    const fach = cachedFaecher.value.find(
      f => f.kuerzel.toLowerCase() === row.fach.toLowerCase(),
    )
    row.idFach = fach?.id ?? null
    if (!fach && row.fach)
      row._errors.push(`Fach „${row.fach}" nicht gefunden`)

    const klasse = klassen.find(k => k.kuerzel.toLowerCase() === row.klasse.toLowerCase())
    row.idKlasse = klasse?.id ?? null
    if (!klasse && row.klasse)
      row._errors.push(`Klasse „${row.klasse}" nicht im gewählten Abschnitt gefunden`)

    const kursartenKatalog = cachedKursarten.value
    row._kursartOk = !row.kursart || kursartenKatalog.size === 0 || kursartenKatalog.has(row.kursart)
    if (row.kursart && kursartenKatalog.size > 0 && !kursartenKatalog.has(row.kursart))
      row._errors.push(`Kursart „${row.kursart}" für Schulform ${schuleStore.schulform ?? '?'} nicht zulässig`)

    row._valid = row._errors.length === 0
  }
}

async function handleKlasseImport(): Promise<void> {
  const abschnittId: number = idSchuljahresabschnitt.value ?? 0
  if (!abschnittId) return

  const selected = klasseGridApi.value?.getSelectedRows() ?? []
  const rows = (selected.length > 0 ? selected : klasseRows.value)
    .filter(r => r._valid && !r._sent)
  if (rows.length === 0) return

  // Alle Schüler des Abschnitts einmalig laden
  const alleSchueler = await fetchSchuelerAuswahlliste(abschnittId)
  // Nur aktive (status 2), nicht gelöschte Schüler
  const aktiveSchueler = alleSchueler.filter(s => s.status === 2)

  // Lernabschnitt-IDs cachen: ein Schüler kommt bei mehreren Fächern wieder vor
  const lernabschnittCache = new Map<number, number | null>()
  async function getLernabschnittId(schuelerId: number): Promise<number | null> {
    if (lernabschnittCache.has(schuelerId)) return lernabschnittCache.get(schuelerId)!
    const id = await fetchLernabschnittId(schuelerId, abschnittId)
    lernabschnittCache.set(schuelerId, id)
    return id
  }

  // Gesamtzahl vorberechnen für Fortschrittsanzeige
  const total = rows.reduce((sum, row) =>
    sum + aktiveSchueler.filter(s => s.idKlasse === row.idKlasse).length, 0)
  klasseImport.value = { running: true, total, done: 0, errors: 0 }

  for (const row of rows) {
    if (row.idFach === null || row.idKlasse === null) continue
    const schuelerInKlasse = aktiveSchueler.filter(s => s.idKlasse === row.idKlasse)

    for (const schueler of schuelerInKlasse) {
      const lernabschnittId = await getLernabschnittId(schueler.id)
      if (lernabschnittId === null) {
        klasseImport.value.errors++
        klasseImport.value.done++
        continue
      }
      const result = await createLeistungsdaten({
        lernabschnittID: lernabschnittId,
        fachID: row.idFach,
        kursart: row.kursart,
        lehrerID: row.idLehrer,
        wochenstunden: row.wochenstunden ? parseInt(row.wochenstunden) || null : null,
        aufZeugnis: row.aufsZeugnis.toLowerCase() === 'true',
      })
      if (!result.success) klasseImport.value.errors++
      klasseImport.value.done++
    }
    row._sent = true
  }

  klasseRows.value = [...klasseRows.value]
  klasseImport.value.running = false
}

// ── Tab 2: Kursunterricht (Kurse anlegen) ─────────────────────────────────

const kursRows = ref<KursRow[]>([])
const parsingKurs = ref(false)
const kursFormat = ref('kurse-csv')
const kursFormats = [
  { label: 'Kurse-CSV (Fach | Kursart | Kursnummer | Lehrer | Std.)', value: 'kurse-csv' },
]

async function onKursFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsingKurs.value = true
  parseError.value = ''
  try {
    kursRows.value = await parseKurseCsv(file)
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen'
  } finally {
    parsingKurs.value = false
  }
}

async function parseKurseCsv(file: File): Promise<KursRow[]> {
  const text = await file.text()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  if (lines.length < 2) throw new Error('Keine Datenzeilen gefunden')
  const header = lines[0].split(/[|;,]/).map(h => h.trim().toLowerCase())
  const col = (names: string[]) => names.reduce((found, n) => found !== -1 ? found : header.indexOf(n), -1)

  const rows: KursRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = line.split(/[|;,]/).map(v => v.trim())
    const get = (names: string[]) => c[col(names)] ?? ''
    const errors: string[] = []
    const fach = get(['fach'])
    const kursart = get(['kursart'])
    if (!fach) errors.push('Fach fehlt')
    if (!kursart) errors.push('Kursart fehlt')
    rows.push({
      _id: crypto.randomUUID(),
      _valid: errors.length === 0,
      _errors: errors,
      _sent: false,
      fach,
      kursart,
      kursnummer: get(['kursnummer', 'nummer']),
      fachlehrer: get(['fachlehrer', 'lehrer']),
      wochenstunden: get(['wochenstd.', 'wochenstunden', 'std.']),
    })
  }
  if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
  return rows
}

function handleKursImport(): void {
  // TODO: POST /db/{schema}/unterrichtsverteilung/kurse/create
}

// ── Tab 3: Schülerunterricht ──────────────────────────────────────────────

const schuelerRows = ref<SchuelerUnterrichtRow[]>([])
const parsingSchueler = ref(false)
const schuelerFormat = ref('schueler-leistungsdaten')
const schuelerFormats = [
  { label: 'Schüler-Leistungsdaten (.dat) — Schüler | Fach | Kurs', value: 'schueler-leistungsdaten' },
]

async function onSchuelerFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsingSchueler.value = true
  parseError.value = ''
  try {
    if (schuelerFormat.value === 'schueler-leistungsdaten') {
      schuelerRows.value = await parseSchuelerLeistungsdaten(file)
    } else {
      throw new Error(`Format "${schuelerFormat.value}" wird noch nicht unterstützt`)
    }
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen'
  } finally {
    parsingSchueler.value = false
  }
}

async function parseSchuelerLeistungsdaten(file: File): Promise<SchuelerUnterrichtRow[]> {
  const text = await file.text()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  if (lines.length < 2) throw new Error('Datei enthält keine Datenzeilen')
  const header = lines[0].split('|').map(h => h.trim())
  const col = (name: string) => header.indexOf(name)
  const rows: SchuelerUnterrichtRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c = line.split('|')
    const get = (name: string) => (c[col(name)] ?? '').trim()
    const errors: string[] = []
    if (!get('Fach')) errors.push('Fach fehlt')
    if (!get('Nachname') && !get('Vorname')) errors.push('Schüler nicht identifizierbar')
    rows.push({
      _id: crypto.randomUUID(),
      _valid: errors.length === 0,
      _errors: errors,
      _sent: false,
      nachname:      get('Nachname'),
      vorname:       get('Vorname'),
      geburtsdatum:  get('Geburtsdatum'),
      jahr:          get('Jahr'),
      abschnitt:     get('Abschnitt'),
      fach:          get('Fach'),
      fachlehrer:    get('Fachlehrer'),
      kursart:       get('Kursart'),
      kurs:          get('Kurs'),
      note:          get('Note'),
      wochenstunden: get('Wochenstd.'),
      jahrgang:      get('Jahrgang'),
    })
  }
  if (rows.length === 0) throw new Error('Keine Datenzeilen gefunden')
  return rows
}

function handleSchuelerImport(): void {
  // TODO: API-Aufruf für Schülerunterricht-Import
}

// ── Tab 4: Kurszuweisung (Drag & Drop) ────────────────────────────────────

const dbKurse = ref<DbKurs[]>([])
const dbSchueler = ref<DbSchueler[]>([])
// kursId → Array der zugewiesenen Schüler-IDs (inkl. unsaved changes)
const assignments = ref<Record<number, number[]>>({})
// IDs der neu hinzugefügten bzw. entfernten Zuweisungen (für Speichern-Button)
const pendingAdded = ref<{ kursId: number; schuelerId: number }[]>([])
const pendingRemoved = ref<{ kursId: number; schuelerId: number }[]>([])
const pendingAssignments = computed(() => pendingAdded.value.length + pendingRemoved.value.length)

const selectedKursId = ref<number | null>(null)
const loadingKurse = ref(false)
const loadingSchueler = ref(false)

const kursSearch = ref('')
const kursartFilter = ref('')
const schuelerSearch = ref('')
const klasseFilter = ref('')

const draggedStudentId = ref<number | null>(null)
const dragOverZone = ref<'pool' | 'assigned' | null>(null)

const filteredKurse = computed(() =>
  dbKurse.value.filter(k => {
    const matchFach = !kursSearch.value ||
      k.fach.toLowerCase().includes(kursSearch.value.toLowerCase())
    const matchArt = !kursartFilter.value || k.kursart === kursartFilter.value
    return matchFach && matchArt
  }),
)

const selectedKurs = computed(() => dbKurse.value.find(k => k.id === selectedKursId.value))
const selectedKursLabel = computed(() => {
  const k = selectedKurs.value
  return k ? `${k.fach} ${k.kursart} ${k.kursnummer}` : ''
})

const assignedIds = computed(() =>
  new Set(selectedKursId.value ? (assignments.value[selectedKursId.value] ?? []) : []),
)

function matchesSchuelerFilter(s: DbSchueler): boolean {
  const matchName = !schuelerSearch.value ||
    `${s.nachname} ${s.vorname}`.toLowerCase().includes(schuelerSearch.value.toLowerCase())
  const matchKlasse = !klasseFilter.value || s.klasse === klasseFilter.value
  return matchName && matchKlasse
}

const filteredPool = computed(() =>
  dbSchueler.value.filter(s => !assignedIds.value.has(s.id) && matchesSchuelerFilter(s)),
)

const filteredAssigned = computed(() =>
  dbSchueler.value.filter(s => assignedIds.value.has(s.id) && matchesSchuelerFilter(s)),
)

const availableKursarten = computed(() => {
  const arten = [...new Set(dbKurse.value.map(k => k.kursart))].filter(Boolean).sort()
  return [
    { label: 'Alle Kursarten', value: '' },
    ...arten.map(a => ({ label: a, value: a })),
  ]
})

const availableKlassen = computed(() => {
  const klassen = [...new Set(dbSchueler.value.map(s => s.klasse))].filter(Boolean).sort()
  return [
    { label: 'Alle Klassen', value: '' },
    ...klassen.map(k => ({ label: k, value: k })),
  ]
})

function onDragStart(event: DragEvent, schuelerId: number): void {
  draggedStudentId.value = schuelerId
  event.dataTransfer?.setData('text/plain', String(schuelerId))
}

function onDragEnd(): void {
  draggedStudentId.value = null
  dragOverZone.value = null
}

function onDropToAssigned(): void {
  const sid = draggedStudentId.value
  const kid = selectedKursId.value
  if (sid === null || kid === null) return
  const current = assignments.value[kid] ?? []
  if (current.includes(sid)) return
  assignments.value = { ...assignments.value, [kid]: [...current, sid] }
  pendingAdded.value = [...pendingAdded.value, { kursId: kid, schuelerId: sid }]
  // Undo aus pendingRemoved falls vorhanden
  pendingRemoved.value = pendingRemoved.value.filter(
    p => !(p.kursId === kid && p.schuelerId === sid),
  )
  dragOverZone.value = null
}

function onDropToPool(): void {
  const sid = draggedStudentId.value
  const kid = selectedKursId.value
  if (sid === null || kid === null) return
  const current = assignments.value[kid] ?? []
  if (!current.includes(sid)) return
  assignments.value = { ...assignments.value, [kid]: current.filter(id => id !== sid) }
  pendingRemoved.value = [...pendingRemoved.value, { kursId: kid, schuelerId: sid }]
  pendingAdded.value = pendingAdded.value.filter(
    p => !(p.kursId === kid && p.schuelerId === sid),
  )
  dragOverZone.value = null
}

async function loadKurse(): Promise<void> {
  loadingKurse.value = true
  try {
    // TODO: const data = await fetchKurseForAbschnitt(idSchuljahresabschnitt.value)
    // dbKurse.value = data
    // assignments.value = buildAssignmentsFromApi(data)
  } finally {
    loadingKurse.value = false
  }
}

async function loadSchueler(): Promise<void> {
  loadingSchueler.value = true
  try {
    // TODO: const data = await fetchSchuelerForAbschnitt(idSchuljahresabschnitt.value)
    // dbSchueler.value = data
  } finally {
    loadingSchueler.value = false
  }
}

async function saveAssignments(): Promise<void> {
  // TODO: POST /db/{schema}/unterrichtsverteilung/schueler/create für pendingAdded
  // TODO: DELETE /db/{schema}/unterrichtsverteilung/schueler/multiple für pendingRemoved
  pendingAdded.value = []
  pendingRemoved.value = []
}

// ── Grid-Konfiguration (gemeinsam) ────────────────────────────────────────

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 80,
}

const rowClassRules = {
  'row-sent':  (p: { data: BaseRow }) => p.data._sent,
  'row-error': (p: { data: BaseRow }) => !p.data._valid && !p.data._sent,
}

function getRowId(params: GetRowIdParams<BaseRow>): string {
  return params.data._id
}

function statusCell<T extends BaseRow>(p: { data: T }): string {
  if (p.data._sent)   return '<span style="color:#22c55e">✔ Gesendet</span>'
  if (!p.data._valid) return `<span style="color:#ef4444" title="${p.data._errors.join('; ')}">✖ Fehler</span>`
  return '<span style="color:#f59e0b">● Bereit</span>'
}

function resolveCell(
  idField: keyof KlassenunterrichtRow,
  labelField: keyof KlassenunterrichtRow,
  tooltip: (row: KlassenunterrichtRow) => string,
) {
  return (p: { data: KlassenunterrichtRow }) => {
    const label = String(p.data[labelField] ?? '').trim()
    if (!label) return '<span style="opacity:.4">—</span>'
    return p.data[idField] !== null
      ? `<span style="color:#22c55e">${label}</span>`
      : `<span style="color:#f59e0b" title="${tooltip(p.data)}">${label} ⚠</span>`
  }
}

const klasseColDefs: ColDef<KlassenunterrichtRow>[] = [
  {
    headerName: '', width: 40, pinned: 'left',
    checkboxSelection: true, headerCheckboxSelection: true,
    sortable: false, filter: false, resizable: false, suppressSizeToFit: true,
  },
  { field: 'schuljahr', headerName: 'Schuljahr', width: 95 },
  {
    headerName: 'Abschnitt', width: 95,
    cellRenderer: resolveCell(
      'idSchuljahresabschnitt', 'abschnitt',
      r => `Schuljahresabschnitt ${r.schuljahr}/${r.abschnitt} nicht gefunden`,
    ),
  },
  {
    headerName: 'Klasse', width: 100,
    cellRenderer: resolveCell(
      'idKlasse', 'klasse',
      r => `Klasse „${r.klasse}" im Abschnitt ${r.schuljahr}/${r.abschnitt} nicht gefunden`,
    ),
  },
  {
    headerName: 'Lehrer', width: 110,
    cellRenderer: resolveCell(
      'idLehrer', 'lehrerKuerzel',
      r => `Lehrer „${r.lehrerKuerzel}" nicht gefunden`,
    ),
  },
  {
    headerName: 'Kursart', width: 90,
    cellRenderer: (p: { data: KlassenunterrichtRow }) => {
      const v = p.data.kursart
      if (!v) return '<span style="opacity:.4">—</span>'
      if (cachedKursarten.value.size === 0) return v
      return p.data._kursartOk
        ? `<span style="color:#22c55e">${v}</span>`
        : `<span style="color:#f59e0b" title="Kursart „${v}" für Schulform ${schuleStore.schulform ?? '?'} nicht zulässig">${v} ⚠</span>`
    },
  },
  {
    headerName: 'Fach', width: 90,
    cellRenderer: resolveCell(
      'idFach', 'fach',
      r => `Fach „${r.fach}" nicht gefunden`,
    ),
  },
  { field: 'wochenstunden', headerName: 'Std./Wo.', width: 85 },
  { field: 'aufsZeugnis',   headerName: 'Aufs.Zeugnis', width: 115 },
  { headerName: 'Status', width: 130, editable: false, cellRenderer: statusCell },
]

const kursColDefs: ColDef<KursRow>[] = [
  { field: 'fach',          headerName: 'Fach',      width: 110 },
  { field: 'kursart',       headerName: 'Kursart',   width: 100 },
  { field: 'kursnummer',    headerName: 'Nummer',    width: 90 },
  { field: 'fachlehrer',    headerName: 'Lehrer',    width: 120 },
  { field: 'wochenstunden', headerName: 'Std./Wo.',  width: 90 },
  { headerName: 'Status', width: 110, editable: false, cellRenderer: statusCell },
]

const schuelerColDefs: ColDef<SchuelerUnterrichtRow>[] = [
  { field: 'nachname',     headerName: 'Nachname',  width: 130 },
  { field: 'vorname',      headerName: 'Vorname',   width: 110 },
  { field: 'geburtsdatum', headerName: 'Geb.-datum', width: 110 },
  { field: 'fach',         headerName: 'Fach',      width: 90,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Fach'))
      ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'fachlehrer',   headerName: 'Lehrer',    width: 110 },
  { field: 'kursart',      headerName: 'Kursart',   width: 100 },
  { field: 'kurs',         headerName: 'Kurs',      width: 130 },
  { field: 'note',         headerName: 'Note',      width: 80 },
  { field: 'wochenstunden', headerName: 'Std./Wo.', width: 90 },
  { field: 'jahrgang',     headerName: 'Jahrgang',  width: 100 },
  { field: 'jahr',         headerName: 'Jahr',      width: 70 },
  { field: 'abschnitt',    headerName: 'Abschnitt', width: 90 },
  { headerName: 'Status', width: 110, editable: false, cellRenderer: statusCell },
]
</script>

<style>
.row-sent  { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }
.dark .row-error { background-color: #3b0c0c !important; }
</style>

<style scoped>
/* ── Basis ────────────────────────────────────────────────────────────── */
.table-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

h2 {
  margin: 0;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.unterricht-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.p-tabpanels) {
  flex: 1;
  min-height: 0;
  padding: 0.75rem 0 0;
}

:deep(.p-tabpanel) {
  height: 100%;
}

.tab-badge {
  margin-left: 0.35rem;
  font-size: 0.7rem;
}

/* ── Tab 1/2/3 gemeinsam ─────────────────────────────────────────────── */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

:deep(.tab-actions .p-button),
:deep(.tab-actions .p-fileupload-basic .p-button) {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: var(--p-surface-100, #f3f4f6);
  border-radius: 8px;
  font-size: 0.83rem;
  color: var(--p-text-color);
  line-height: 1.5;
}

.hint-box--dark {
  background: #1e293b;
  color: #e2e8f0;
}

.hint-box .pi {
  font-size: 1rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
  color: var(--p-primary-color);
}

.data-table {
  flex: 1;
  min-height: 300px;
}

.lookup-loading {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}

.import-result {
  font-size: 0.75rem;
  color: #22c55e;
}

:deep(.header-left .p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
}

/* ── Tab 4: Kurszuweisung ─────────────────────────────────────────────── */
.zuweisung-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.zuweisung-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem 0.75rem;
  background: var(--p-surface-50, #f9fafb);
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
}

.is-dark .zuweisung-toolbar {
  background: var(--p-surface-900, #111827);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.toolbar-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  white-space: nowrap;
}

.toolbar-sep {
  width: 1px;
  height: 1.5rem;
  background: var(--p-surface-border);
  margin: 0 0.25rem;
}

:deep(.zuweisung-toolbar .p-button),
:deep(.zuweisung-toolbar .p-inputtext) {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

.zuweisung-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 0.75rem;
}

/* ── Panels ──────────────────────────────────────────────────────────── */
.panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--p-surface-100, #f3f4f6);
  border-bottom: 1px solid var(--p-surface-border);
  flex-shrink: 0;
}

.is-dark .panel-header {
  background: var(--p-surface-800, #1f2937);
}

.panel-title {
  font-size: 0.78rem;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 15%, transparent);
  border-radius: 10px;
  padding: 0.05rem 0.4rem;
  flex-shrink: 0;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
  padding: 2rem 1rem;
  text-align: center;
}

.panel-empty .pi {
  font-size: 1.5rem;
  opacity: 0.4;
}

/* ── Kursliste ───────────────────────────────────────────────────────── */
.kurs-panel {
  overflow: hidden;
}

.kurs-list {
  overflow-y: auto;
  flex: 1;
}

.kurs-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--p-surface-border);
  transition: background 0.15s;
  font-size: 0.8rem;
}

.kurs-item:hover {
  background: var(--p-surface-100, #f3f4f6);
}

.is-dark .kurs-item:hover {
  background: var(--p-surface-700, #374151);
}

.kurs-item--selected {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent) !important;
  border-left: 3px solid var(--p-primary-color);
}

.kurs-item-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.kurs-fach {
  font-weight: 600;
  font-size: 0.82rem;
}

.kurs-meta {
  font-size: 0.7rem;
  color: var(--p-text-muted-color);
}

.kurs-item-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.kurs-lehrer {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
}

.kurs-count-badge {
  font-size: 0.68rem;
  font-weight: 700;
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 10px;
  padding: 0.05rem 0.35rem;
  min-width: 1.4rem;
  text-align: center;
}

.is-dark .kurs-count-badge {
  background: var(--p-surface-600, #4b5563);
}

/* ── Schüler-Panel ───────────────────────────────────────────────────── */
.schueler-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
}

.schueler-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.schueler-section--inactive {
  opacity: 0.6;
}

.drop-zone {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.4rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 0.3rem;
  transition: background 0.15s;
}

.drop-zone--target {
  background: color-mix(in srgb, var(--p-primary-color) 4%, transparent);
}

.drop-zone--over {
  background: color-mix(in srgb, var(--p-primary-color) 14%, transparent);
  outline: 2px dashed var(--p-primary-color);
  outline-offset: -2px;
}

.drop-zone--disabled {
  pointer-events: none;
}

.drop-hint {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--p-text-muted-color);
  font-size: 0.78rem;
  padding: 1rem;
  text-align: center;
}

.drop-hint--muted {
  opacity: 0.6;
}

/* ── Schüler-Karten ──────────────────────────────────────────────────── */
.schueler-card {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 6px;
  font-size: 0.78rem;
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.schueler-card:hover {
  border-color: var(--p-primary-400);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.schueler-card:active {
  cursor: grabbing;
}

.schueler-card--assigned {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 8%, var(--p-surface-card));
}

.schueler-name {
  font-weight: 500;
}

.klasse-tag {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 4px;
  padding: 0.05rem 0.3rem;
}

.is-dark .klasse-tag {
  background: var(--p-surface-700, #374151);
}
</style>
