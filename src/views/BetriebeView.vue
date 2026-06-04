<template>
  <div class="table-view">
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
        <h2>Betriebe</h2>
      </div>
      <div class="header-actions">
        <Button
          v-tooltip.top="'Betriebe aus Datenbank laden'"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          text
          :loading="store.loadingExisting"
          @click="handleLoadExisting"
        />
      </div>
    </div>

    <Message v-if="loadError" severity="error" :closable="true" @close="loadError = ''">
      {{ loadError }}
    </Message>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="betriebe">
          Betriebe
          <Badge v-if="store.betriebeTotalCount > 0" :value="store.betriebeTotalCount" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="ansprechpartner">
          Ansprechpartner
          <Badge v-if="store.apTotalCount > 0" :value="store.apTotalCount" severity="secondary" class="tab-badge" />
        </Tab>
      </TabList>

      <TabPanels>
        <!-- ── Betriebe ───────────────────────────────────────────────── -->
        <TabPanel value="betriebe">
          <div class="tab-content">
            <div class="tab-actions">
              <ImportStats
                :total="store.betriebeTotalCount"
                :valid="store.betriebeValidCount"
                :errors="store.betriebeErrorCount"
                :sent="store.betriebeSentCount"
              />
              <div class="action-buttons">
                <FileUpload
                  mode="basic"
                  :auto="false"
                  :multiple="false"
                  accept=".csv,.dat"
                  chooseLabel="Datei laden"
                  chooseIcon="pi pi-folder-open"
                  :maxFileSize="10000000"
                  :disabled="betriebeParsing"
                  @select="onBetriebeFileSelect"
                />
                <Button
                  :label="store.uploading ? `${store.uploadProgress} / ${store.uploadTotal}` : betriebeSelectedCount > 0 ? `${betriebeSelectedCount} senden` : 'Alles senden'"
                  icon="pi pi-upload"
                  size="small"
                  :disabled="store.betriebeValidCount === 0 || store.uploading"
                  :loading="store.uploading"
                  @click="handleUploadBetriebe"
                />
                <Button
                  :label="store.uploading ? 'Stoppen' : 'Leeren'"
                  :icon="store.uploading ? 'pi pi-stop' : 'pi pi-trash'"
                  :severity="store.uploading ? 'warn' : 'danger'"
                  text
                  size="small"
                  @click="store.uploading ? store.stopUpload() : confirmClearBetriebe()"
                />
              </div>
            </div>

            <Message v-if="betriebeParseError" severity="error" :closable="true" @close="betriebeParseError = ''">
              {{ betriebeParseError }}
            </Message>
            <Message v-if="betriebeUploadResult" :severity="betriebeUploadResult.failed > 0 ? 'warn' : 'success'" :closable="true" @close="betriebeUploadResult = null">
              {{ betriebeUploadResult.sent }} Betriebe übertragen
              <span v-if="betriebeUploadResult.failed > 0">, {{ betriebeUploadResult.failed }} fehlgeschlagen</span>
            </Message>

            <div class="section">
              <h3 class="section-title">Vorhandene Betriebe</h3>
              <ag-grid-vue
                :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'existing-table']"
                :rowData="store.existingBetriebe"
                :columnDefs="existingBetriebeColDefs"
                :defaultColDef="readOnlyColDef"
                rowSelection="single"
                :suppressRowClickSelection="true"
                :animateRows="true"
                @grid-ready="onExistingBetriebeGridReady"
                @selection-changed="onExistingBetriebeSelectionChanged"
              />
            </div>

            <div class="section import-section">
              <h3 class="section-title">Zu importierende Betriebe</h3>
              <ag-grid-vue
                :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
                :rowData="store.betriebeRows"
                :columnDefs="betriebeImportColDefs"
                :defaultColDef="defaultColDef"
                :rowClassRules="rowClassRules"
                :getRowId="getBetriebeRowId"
                rowSelection="multiple"
                :suppressRowClickSelection="true"
                @cell-value-changed="onBetriebeCellChanged"
                @grid-ready="onBetriebeGridReady"
                @selection-changed="onBetriebeSelectionChanged"
                :animateRows="true"
                :stopEditingWhenCellsLoseFocus="true"
              />
            </div>
          </div>
        </TabPanel>

        <!-- ── Ansprechpartner ────────────────────────────────────────── -->
        <TabPanel value="ansprechpartner">
          <div class="tab-content">
            <div class="tab-actions">
              <ImportStats
                :total="store.apTotalCount"
                :valid="store.apValidCount"
                :errors="store.apErrorCount"
                :sent="store.apSentCount"
              />
              <div class="action-buttons">
                <FileUpload
                  mode="basic"
                  :auto="false"
                  :multiple="false"
                  accept=".csv,.dat"
                  chooseLabel="Datei laden"
                  chooseIcon="pi pi-folder-open"
                  :maxFileSize="10000000"
                  :disabled="apParsing"
                  @select="onApFileSelect"
                />
                <Button
                  :label="store.uploading ? `${store.uploadProgress} / ${store.uploadTotal}` : apSelectedCount > 0 ? `${apSelectedCount} senden` : 'Alles senden'"
                  icon="pi pi-upload"
                  size="small"
                  :disabled="store.apValidCount === 0 || store.uploading"
                  :loading="store.uploading"
                  @click="handleUploadAnsprechpartner"
                />
                <Button
                  :label="store.uploading ? 'Stoppen' : 'Leeren'"
                  :icon="store.uploading ? 'pi pi-stop' : 'pi pi-trash'"
                  :severity="store.uploading ? 'warn' : 'danger'"
                  text
                  size="small"
                  @click="store.uploading ? store.stopUpload() : confirmClearAp()"
                />
              </div>
            </div>

            <div class="betrieb-context">
              <template v-if="selectedExistingBetrieb">
                <span class="context-label">Ausgewählter Betrieb:</span>
                <Tag :value="selectedExistingBetrieb.name ?? ''" severity="info" />
                <span class="context-hint">Ansprechpartner werden diesem Betrieb zugeordnet.</span>
              </template>
              <Message v-else severity="info" :closable="false" class="ap-info">
                Wähle im Tab „Betriebe" einen Betrieb aus oder stelle sicher, dass die Spalte
                <strong>Betrieb</strong> in der CSV den Betriebsnamen enthält.
              </Message>
            </div>

            <Message v-if="apParseError" severity="error" :closable="true" @close="apParseError = ''">
              {{ apParseError }}
            </Message>
            <Message v-if="apUploadResult" :severity="apUploadResult.failed > 0 || apUploadResult.unresolved > 0 ? 'warn' : 'success'" :closable="true" @close="apUploadResult = null">
              {{ apUploadResult.sent }} Ansprechpartner übertragen
              <span v-if="apUploadResult.failed > 0">, {{ apUploadResult.failed }} fehlgeschlagen</span>
              <span v-if="apUploadResult.unresolved > 0">, {{ apUploadResult.unresolved }} Betrieb nicht gefunden</span>
            </Message>

            <div class="section">
              <h3 class="section-title">
                Vorhandene Ansprechpartner
                <span v-if="selectedExistingBetrieb" class="section-filter-hint">
                  — {{ filteredExistingAnsprechpartner.length }} für „{{ selectedExistingBetrieb.name }}"
                </span>
              </h3>
              <ag-grid-vue
                :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'existing-table']"
                :rowData="filteredExistingAnsprechpartner"
                :columnDefs="existingApColDefs"
                :defaultColDef="readOnlyColDef"
                :animateRows="true"
              />
            </div>

            <div class="section import-section">
              <h3 class="section-title">Zu importierende Ansprechpartner</h3>
              <ag-grid-vue
                :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
                :rowData="store.ansprechpartnerRows"
                :columnDefs="apImportColDefs"
                :defaultColDef="defaultColDef"
                :rowClassRules="rowClassRules"
                :getRowId="getApRowId"
                rowSelection="multiple"
                :suppressRowClickSelection="true"
                @cell-value-changed="onApCellChanged"
                @grid-ready="onApGridReady"
                @selection-changed="onApSelectionChanged"
                :animateRows="true"
                :stopEditingWhenCellsLoseFocus="true"
              />
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, type ColDef, type GetRowIdParams, type CellValueChangedEvent, type GridApi, type GridReadyEvent } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Badge from 'primevue/badge'
import Tabs from 'primevue/tabs'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useBetriebeStore } from '@/stores/betriebe'
import type { BetriebImportRow, AnsprechpartnerImportRow, BetriebDetails } from '@/models/Betriebe'
import ImportStats from '@/components/ImportStats.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { parseBetriebeCsv, parseAnsprechpartnerCsv } from '@/utils/csvParser'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useBetriebeStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()

const activeTab = ref('betriebe')
const loadError = ref('')

// Ausgewählter Betrieb (Einzelauswahl in "Vorhandene Betriebe")
const selectedExistingBetrieb = ref<BetriebDetails | null>(null)
const existingBetriebeGridApi = ref<GridApi | null>(null)

// Betriebe
const betriebeParseError = ref('')
const betriebeParsing = ref(false)
const betriebeUploadResult = ref<{ sent: number; failed: number } | null>(null)
const betriebeGridApi = ref<GridApi | null>(null)
const betriebeSelectedCount = ref(0)

// Ansprechpartner
const apParseError = ref('')
const apParsing = ref(false)
const apUploadResult = ref<{ sent: number; failed: number; unresolved: number } | null>(null)
const apGridApi = ref<GridApi | null>(null)
const apSelectedCount = ref(0)

// ── Grid-Callbacks ───────────────────────────────────────────────────────────

function onExistingBetriebeGridReady(params: GridReadyEvent): void {
  existingBetriebeGridApi.value = params.api
}

function onExistingBetriebeSelectionChanged(): void {
  const rows = existingBetriebeGridApi.value?.getSelectedRows() ?? []
  selectedExistingBetrieb.value = (rows[0] as BetriebDetails) ?? null
}

const filteredExistingAnsprechpartner = computed(() => {
  if (!selectedExistingBetrieb.value) return store.existingAnsprechpartner
  const id = selectedExistingBetrieb.value.id
  return store.existingAnsprechpartner.filter(ap => ap.idBetrieb === id)
})

function onBetriebeGridReady(params: GridReadyEvent): void {
  betriebeGridApi.value = params.api
}
function onBetriebeSelectionChanged(): void {
  betriebeSelectedCount.value = betriebeGridApi.value?.getSelectedRows().length ?? 0
}
function onApGridReady(params: GridReadyEvent): void {
  apGridApi.value = params.api
}
function onApSelectionChanged(): void {
  apSelectedCount.value = apGridApi.value?.getSelectedRows().length ?? 0
}

// ── Datei-Import ─────────────────────────────────────────────────────────────

async function onBetriebeFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  betriebeParsing.value = true
  betriebeParseError.value = ''
  try {
    const rows = await parseBetriebeCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    store.setBetriebeRows(rows)
    store.validateAllBetriebe()
  } catch (e) {
    betriebeParseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    betriebeParsing.value = false
  }
}

async function onApFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  apParsing.value = true
  apParseError.value = ''
  try {
    const rows = await parseAnsprechpartnerCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    // Betriebname aus Auswahl vorbelegen, wenn kein eigener gesetzt
    if (selectedExistingBetrieb.value?.name) {
      const name = selectedExistingBetrieb.value.name
      for (const row of rows) {
        if (!row.betriebName) row.betriebName = name
      }
    }
    store.setAnsprechpartnerRows(rows)
    store.validateAllAnsprechpartner()
  } catch (e) {
    apParseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    apParsing.value = false
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────

async function handleUploadBetriebe(): Promise<void> {
  betriebeUploadResult.value = null
  const selected = betriebeGridApi.value?.getSelectedRows() ?? []
  const selectedIds = selected.length > 0 ? new Set(selected.map((r: { _id: string }) => r._id)) : undefined
  betriebeUploadResult.value = await store.uploadBetriebe(selectedIds)
  if ((betriebeUploadResult.value?.sent ?? 0) > 0) {
    await handleLoadExisting()
  }
}

async function handleUploadAnsprechpartner(): Promise<void> {
  apUploadResult.value = null
  const selected = apGridApi.value?.getSelectedRows() ?? []
  const selectedIds = selected.length > 0 ? new Set(selected.map((r: { _id: string }) => r._id)) : undefined
  apUploadResult.value = await store.uploadAnsprechpartner(selectedIds)
  if ((apUploadResult.value?.sent ?? 0) > 0) {
    await handleLoadExisting()
  }
}

// ── Sonstiges ─────────────────────────────────────────────────────────────────

async function handleLoadExisting(): Promise<void> {
  loadError.value = ''
  const result = await store.loadExisting()
  if (result.error) loadError.value = result.error
}

function confirmClearBetriebe(): void {
  confirm.require({
    message: 'Alle Betriebs-Importdaten verwerfen?',
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, leeren',
    rejectLabel: 'Abbrechen',
    accept: () => store.clearBetriebe(),
  })
}

function confirmClearAp(): void {
  confirm.require({
    message: 'Alle Ansprechpartner-Importdaten verwerfen?',
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, leeren',
    rejectLabel: 'Abbrechen',
    accept: () => store.clearAnsprechpartner(),
  })
}

function onBetriebeCellChanged(event: CellValueChangedEvent<BetriebImportRow>): void {
  if (event.data) {
    store.updateBetriebeRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

function onApCellChanged(event: CellValueChangedEvent<AnsprechpartnerImportRow>): void {
  if (event.data) {
    store.updateAnsprechpartnerRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

;(window as unknown as Record<string, unknown>).__deleteBetrieb = (id: string) => {
  store.deleteBetriebeRow(id)
}

;(window as unknown as Record<string, unknown>).__deleteAnsprechpartner = (id: string) => {
  store.deleteAnsprechpartnerRow(id)
}

onMounted(async () => {
  await handleLoadExisting()
})

// ── ColDefs ───────────────────────────────────────────────────────────────────

const readOnlyColDef: ColDef = {
  editable: false,
  sortable: true,
  filter: true,
  resizable: true,
}

const defaultColDef: ColDef = {
  editable: (params) => !params.data._sent,
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 80,
}

const rowClassRules = {
  'row-sent':  (params: { data: { _sent: boolean; _valid: boolean } }) => params.data._sent,
  'row-error': (params: { data: { _sent: boolean; _valid: boolean } }) => !params.data._valid && !params.data._sent,
}

const existingBetriebeColDefs: ColDef[] = [
  { field: 'id',         headerName: 'ID',       width: 80,
    checkboxSelection: true },
  { field: 'name',       headerName: 'Name',     flex: 1 },
  { field: 'nameZusatz', headerName: 'Zusatz',   width: 160 },
  { field: 'branche',    headerName: 'Branche',  width: 160 },
  { field: 'strasse',    headerName: 'Straße',   width: 180,
    valueGetter: (p: { data: Record<string, unknown> }) =>
      [p.data?.strasse, p.data?.hausnummer].filter(Boolean).join(' ') },
  { field: 'telefon1',   headerName: 'Telefon',  width: 140 },
  { field: 'eMail',      headerName: 'E-Mail',   flex: 1 },
  { field: 'ansprechpartner', headerName: 'AP', width: 60,
    valueGetter: (p: { data: Record<string, unknown> }) =>
      Array.isArray(p.data?.ansprechpartner) ? (p.data.ansprechpartner as unknown[]).length : 0 },
]

const betriebeImportColDefs: ColDef<BetriebImportRow>[] = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160,
    checkboxSelection: true, headerCheckboxSelection: true,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Name')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'nameZusatz',    headerName: 'Zusatz',     width: 140 },
  { field: 'branche',       headerName: 'Branche',    width: 130 },
  { field: 'plz',           headerName: 'PLZ',         width: 80 },
  { field: 'ort',           headerName: 'Ort',         width: 120 },
  { field: 'strasse',       headerName: 'Straße',     width: 160 },
  { field: 'hausnummer',    headerName: 'Hnr.',        width: 70 },
  { field: 'telefon1',      headerName: 'Telefon 1',  width: 130 },
  { field: 'eMail',         headerName: 'E-Mail',     width: 180 },
  { field: 'istAusbildungsbetrieb', headerName: 'Ausbildung', width: 110 },
  {
    headerName: 'Status',
    width: 110,
    editable: false,
    cellRenderer: (params: { data: BetriebImportRow }) => {
      if (params.data._sent) return '<span style="color:#22c55e">✔ Gesendet</span>'
      if (!params.data._valid) return `<span style="color:#ef4444" title="${params.data._errors.join('; ')}">✖ Fehler</span>`
      return '<span style="color:#f59e0b">● Bereit</span>'
    },
  },
  {
    headerName: '',
    width: 50,
    editable: false,
    sortable: false,
    filter: false,
    cellRenderer: (params: { data: BetriebImportRow }) =>
      params.data._sent
        ? ''
        : `<button onclick="window.__deleteBetrieb('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
  },
]

const existingApColDefs: ColDef[] = [
  { field: 'id',          headerName: 'ID',      width: 80 },
  { field: 'betriebName', headerName: 'Betrieb', flex: 1 },
  { field: 'anrede',      headerName: 'Anrede',  width: 90 },
  { field: 'name',        headerName: 'Name',    width: 160 },
  { field: 'rufname',     headerName: 'Rufname', width: 130 },
  { field: 'telefon',     headerName: 'Telefon', width: 140 },
  { field: 'eMail',       headerName: 'E-Mail',  flex: 1 },
]

const apImportColDefs: ColDef<AnsprechpartnerImportRow>[] = [
  { field: 'betriebName', headerName: 'Betrieb', flex: 1, minWidth: 160,
    checkboxSelection: true, headerCheckboxSelection: true,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Betrieb')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'anrede',  headerName: 'Anrede',  width: 90 },
  { field: 'name',    headerName: 'Name',    width: 160,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Name')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'rufname', headerName: 'Rufname', width: 130 },
  { field: 'telefon', headerName: 'Telefon', width: 140 },
  { field: 'eMail',   headerName: 'E-Mail',  flex: 1 },
  {
    headerName: 'Status',
    width: 110,
    editable: false,
    cellRenderer: (params: { data: AnsprechpartnerImportRow }) => {
      if (params.data._sent) return '<span style="color:#22c55e">✔ Gesendet</span>'
      if (!params.data._valid) return `<span style="color:#ef4444" title="${params.data._errors.join('; ')}">✖ Fehler</span>`
      return '<span style="color:#f59e0b">● Bereit</span>'
    },
  },
  {
    headerName: '',
    width: 50,
    editable: false,
    sortable: false,
    filter: false,
    cellRenderer: (params: { data: AnsprechpartnerImportRow }) =>
      params.data._sent
        ? ''
        : `<button onclick="window.__deleteAnsprechpartner('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
  },
]

function getBetriebeRowId(params: GetRowIdParams<BetriebImportRow>): string {
  return params.data._id
}

function getApRowId(params: GetRowIdParams<AnsprechpartnerImportRow>): string {
  return params.data._id
}
</script>

<style>
.row-sent  { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }
.dark .row-error { background-color: #3b0c0c !important; }
</style>

<style scoped>
.table-view {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  padding-bottom: 1.5rem;
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
  gap: 0.5rem;
}

h2 {
  margin: 0;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
}

.tab-badge {
  margin-left: 0.4rem;
  font-size: 0.7rem;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.tab-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
}

.ap-info {
  font-size: 0.82rem;
}

.betrieb-context {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 2rem;
}

.context-label {
  font-size: 0.82rem;
  color: var(--p-text-muted-color);
}

.context-hint {
  font-size: 0.82rem;
  color: var(--p-text-muted-color);
}

.section-filter-hint {
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.import-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.existing-table {
  height: 200px;
}

.data-table {
  height: 380px;
}

:deep(.action-buttons .p-button),
:deep(.p-fileupload-basic .p-button) {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

:deep(.action-buttons .p-button .p-button-icon),
:deep(.p-fileupload-basic .p-button .p-button-icon) {
  font-size: 0.75rem;
}

:deep(.p-fileupload-label),
:deep(.p-fileupload-basic-content > span:not([class*="p-button"])) {
  font-size: 0.72rem;
  color: var(--p-text-muted-color);
}

:deep(.p-tabpanel) {
  padding: 0;
}
</style>
