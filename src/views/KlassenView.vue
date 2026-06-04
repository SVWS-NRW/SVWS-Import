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
        <h2>Klassendaten</h2>
        <Select
          v-if="schuleStore.loaded"
          v-model="store.idSchuljahresabschnitt"
          :options="schuleStore.abschnitteOptions"
          optionLabel="label"
          optionValue="id"
          placeholder="Abschnitt wählen"
          size="small"
          style="width: 160px"
        />
        <InputNumber
          v-else
          v-model="store.idSchuljahresabschnitt"
          :min="1"
          size="small"
          style="width: 100px"
        />
      </div>
      <ImportStats
        :total="store.totalCount"
        :valid="store.validCount"
        :errors="store.errorCount"
        :sent="store.sentCount"
      />
      <div class="header-actions">
        <FileUpload
          mode="basic"
          :auto="false"
          :multiple="false"
          accept=".csv,.dat"
          chooseLabel="Datei laden"
          chooseIcon="pi pi-folder-open"
          :maxFileSize="10000000"
          :disabled="parsing"
          @select="onFileSelect"
        />
        <Button
          :label="store.uploading ? `${store.uploadProgress} / ${store.uploadTotal}` : selectedCount > 0 ? `${selectedCount} senden` : 'Alles senden'"
          icon="pi pi-upload"
          size="small"
          :disabled="store.validCount === 0 || store.uploading"
          :loading="store.uploading"
          @click="handleUploadAll"
        />
        <Button
          :label="store.uploading ? 'Stoppen' : 'Leeren'"
          :icon="store.uploading ? 'pi pi-stop' : 'pi pi-trash'"
          :severity="store.uploading ? 'warn' : 'danger'"
          size="small"
          text
          @click="store.uploading ? store.stopUpload() : confirmClear()"
        />
        <Button
          v-tooltip.top="'Klassen aus Datenbank laden'"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          text
          :loading="store.loadingExisting"
          @click="handleLoadExisting"
        />
      </div>
    </div>

    <Message v-if="parseError" severity="error" :closable="true" @close="parseError = ''">
      {{ parseError }}
    </Message>

    <Message v-if="uploadResult" :severity="uploadResult.failed > 0 ? 'warn' : 'success'" :closable="true" @close="uploadResult = null">
      {{ uploadResult.sent }} Datensätze übertragen
      <span v-if="uploadResult.failed > 0">, {{ uploadResult.failed }} fehlgeschlagen</span>
    </Message>

    <Message v-if="loadError" severity="error" :closable="true" @close="loadError = ''">
      {{ loadError }}
    </Message>

    <div class="section">
      <h3 class="section-title">
        Vorhandene Klassen
        <span class="section-badge">{{ schuleStore.labelForId(store.idSchuljahresabschnitt) }}</span>
      </h3>
      <ag-grid-vue
        :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'existing-table']"
        :rowData="store.existingKlassen"
        :columnDefs="existingColDefs"
        :defaultColDef="readOnlyColDef"
        :animateRows="true"
      />
    </div>

    <div class="section import-section">
      <h3 class="section-title">
        Zu importierende Klassen
        <span v-if="store.fileJahr" class="section-badge">
          Schuljahr {{ store.fileJahr }}, Abschnitt {{ store.fileAbschnitt }}
        </span>
      </h3>
      <ag-grid-vue
        :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
        :rowData="store.rows"
        :columnDefs="importColDefs"
        :defaultColDef="defaultColDef"
        :rowClassRules="rowClassRules"
        :getRowId="getRowId"
        rowSelection="multiple"
        :suppressRowClickSelection="true"
        @cell-value-changed="onCellChanged"
        @grid-ready="onImportGridReady"
        @row-data-updated="onImportRowDataUpdated"
        @selection-changed="onSelectionChanged"
        :animateRows="true"
        :stopEditingWhenCellsLoseFocus="true"
      />
    </div>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, type ColDef, type GetRowIdParams, type CellValueChangedEvent, type GridApi } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useKlassenStore } from '@/stores/klassen'
import { useSchuleStore } from '@/stores/schule'
import { useJahrgaengeStore } from '@/stores/jahrgaenge'
import { type KlasseImportRow } from '@/models/Klassen'
import { fetchLehrkraefte } from '@/services/svwsService'
import ImportStats from '@/components/ImportStats.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { parseKlassenCsv } from '@/utils/csvParser'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useKlassenStore()
const schuleStore = useSchuleStore()
const jahrgaengeStore = useJahrgaengeStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()
const importGridApi = ref<GridApi | null>(null)
const selectedCount = ref(0)

function onImportGridReady(params: { api: GridApi }): void {
  importGridApi.value = params.api
}

function onImportRowDataUpdated(): void {
  importGridApi.value?.refreshCells({ force: true })
}

function onSelectionChanged(): void {
  selectedCount.value = importGridApi.value?.getSelectedRows().length ?? 0
}

onMounted(async () => {
  if (schuleStore.loaded) {
    const defaultId = schuleStore.aktuellerAbschnittId ?? schuleStore.abschnitteOptions[0]?.id ?? null
    if (defaultId !== null) store.idSchuljahresabschnitt = defaultId
  }
  const [, lehrkraefte] = await Promise.all([
    jahrgaengeStore.existingJahrgaenge.length === 0 ? jahrgaengeStore.loadExisting() : Promise.resolve(),
    fetchLehrkraefte(),
  ])
  store.resolveJahrgaenge(jahrgaengeStore.existingJahrgaenge)
  store.resolveLehrkraefte(lehrkraefte)
})
const uploadResult = ref<{ sent: number; failed: number } | null>(null)
const loadError = ref('')
const parseError = ref('')
const parsing = ref(false)

async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsing.value = true
  parseError.value = ''
  try {
    const rows = await parseKlassenCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    store.setRows(rows)
    store.validateAll()
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    parsing.value = false
  }
}

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

const existingColDefs: ColDef[] = [
  { field: 'id',               headerName: 'ID',           width: 80 },
  { field: 'kuerzel',          headerName: 'Kürzel',       width: 110 },
  { field: 'kuerzelStatistik', headerName: 'Statistik-Kz.', width: 130 },
  { field: 'beschreibung',     headerName: 'Bezeichnung',  flex: 1 },
]

const importColDefs: ColDef<KlasseImportRow>[] = [
  { field: 'kuerzel',          headerName: 'Kürzel',        width: 100,
    checkboxSelection: true, headerCheckboxSelection: true,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Kürzel')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'kuerzelStatistik', headerName: 'Statistik-Kz.', width: 120 },
  { field: 'beschreibung',     headerName: 'Bezeichnung',   flex: 1.5 },
  {
    field: 'jahrgang',
    headerName: 'Jahrgang',
    width: 140,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Jahrgang')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null,
    cellRenderer: (params: { data: KlasseImportRow }) => {
      const { jahrgang, idJahrgang } = params.data
      if (!jahrgang) return '<span style="color:#9ca3af">—</span>'
      if (idJahrgang !== null) return `<span style="color:#22c55e" title="ID: ${idJahrgang}">${jahrgang} <small style="opacity:.7">→ ${idJahrgang}</small></span>`
      return `<span style="color:#f59e0b" title="Kein passender Jahrgang in der DB">${jahrgang} ⚠</span>`
    },
  },
  { field: 'folgeklasse',      headerName: 'Folgeklasse',   width: 120 },
  {
    field: 'klassenlehrer',
    headerName: 'Klassenlehrer',
    width: 150,
    cellRenderer: (params: { data: KlasseImportRow }) => {
      const { klassenlehrer, idKlassenlehrer } = params.data
      if (!klassenlehrer) return '<span style="color:#9ca3af">—</span>'
      if (idKlassenlehrer !== null) return `<span style="color:#22c55e" title="ID: ${idKlassenlehrer}">${klassenlehrer} <small style="opacity:.7">→ ${idKlassenlehrer}</small></span>`
      return `<span style="color:#f59e0b" title="Kein passender Lehrer in der DB">${klassenlehrer} ⚠</span>`
    },
  },
  { field: 'orgForm',          headerName: 'Org.Form',      width: 100 },
  { field: 'klassenart',       headerName: 'Klassenart',    width: 110 },
  { field: 'gliederung',       headerName: 'Gliederung',    width: 110 },
  { field: 'fachklasse',       headerName: 'Fachklasse',    width: 110 },
  { field: 'jahr',             headerName: 'Jahr',          width: 80 },
  { field: 'abschnitt',        headerName: 'Abschnitt',     width: 100 },
  {
    headerName: 'Status',
    width: 110,
    editable: false,
    cellRenderer: (params: { data: KlasseImportRow }) => {
      if (params.data._sent) return '<span style="color:#22c55e">✔ Gesendet</span>'
      if (!params.data._valid) return `<span style="color:#ef4444" title="${params.data._errors.join('; ')}">✖ Fehler</span>`
      return '<span style="color:#f59e0b">● Bereit</span>'
    },
  },
  {
    headerName: '',
    width: 60,
    editable: false,
    sortable: false,
    filter: false,
    cellRenderer: (params: { data: KlasseImportRow }) =>
      params.data._sent
        ? ''
        : `<button onclick="window.__deleteKlasse('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
  },
]

const rowClassRules = {
  'row-sent':  (params: { data: KlasseImportRow }) => params.data._sent,
  'row-error': (params: { data: KlasseImportRow }) => !params.data._valid && !params.data._sent,
}

function getRowId(params: GetRowIdParams<KlasseImportRow>): string {
  return params.data._id
}

function onCellChanged(event: CellValueChangedEvent<KlasseImportRow>): void {
  if (event.data) {
    store.updateRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

;(window as unknown as Record<string, unknown>).__deleteKlasse = (id: string) => {
  store.deleteRow(id)
}

async function handleLoadExisting(): Promise<void> {
  loadError.value = ''
  const [result, lehrkraefte] = await Promise.all([
    store.loadExisting(),
    fetchLehrkraefte(),
  ])
  if (result.error) loadError.value = result.error
  store.resolveJahrgaenge(jahrgaengeStore.existingJahrgaenge)
  store.resolveLehrkraefte(lehrkraefte)
}

async function doUpload(): Promise<void> {
  uploadResult.value = null
  const selected = importGridApi.value?.getSelectedRows() ?? []
  const selectedIds = selected.length > 0 ? new Set(selected.map((r: { _id: string }) => r._id)) : undefined
  uploadResult.value = await store.uploadAll(selectedIds)
  importGridApi.value?.refreshCells({ force: true })
  if ((uploadResult.value?.sent ?? 0) > 0) {
    await store.loadExisting()
  }
}

async function handleUploadAll(): Promise<void> {
  const selected = schuleStore.abschnittForId(store.idSchuljahresabschnitt)
  const mismatch = selected && store.fileJahr && (
    selected.schuljahr !== parseInt(store.fileJahr) ||
    selected.abschnitt !== parseInt(store.fileAbschnitt)
  )
  if (mismatch) {
    const fileLabel = `${store.fileJahr}/${String(parseInt(store.fileJahr) + 1).slice(-2)} – ${store.fileAbschnitt === '1' ? '1. Halbjahr' : '2. Halbjahr'}`
    confirm.require({
      message: `Die Importdatei enthält Klassen für ${fileLabel}, der gewählte Abschnitt ist aber „${schuleStore.labelForId(store.idSchuljahresabschnitt)}". Trotzdem importieren?`,
      header: 'Abschnitt stimmt nicht überein',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, trotzdem importieren',
      rejectLabel: 'Abbrechen',
      accept: doUpload,
    })
  } else {
    await doUpload()
  }
}

function confirmClear(): void {
  confirm.require({
    message: 'Alle Klassendaten verwerfen?',
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, leeren',
    rejectLabel: 'Abbrechen',
    accept: () => {
      store.clear()
      router.push({ name: 'import' })
    },
  })
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
  flex-direction: row;
  align-items: center;
  gap: 0.25rem;
}

h2 {
  margin: 0;
  font-size: 0.9rem;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
}

:deep(.header-left .p-select) {
  font-size: 0.72rem;
}
:deep(.header-left .p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
}
:deep(.header-left .p-select .p-select-dropdown) {
  width: 1.25rem;
}
:deep(.header-left .p-select .p-select-dropdown .p-icon) {
  width: 0.65rem;
  height: 0.65rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.import-section {
  flex: 1;
  min-height: 0;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
}

:global(.dark) .section-badge {
  background: var(--p-surface-700, #374151);
}

.existing-table {
  height: 220px;
}

:deep(.header-actions .p-button),
:deep(.p-fileupload-basic .p-button) {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

:deep(.header-actions .p-button .p-button-icon),
:deep(.p-fileupload-basic .p-button .p-button-icon) {
  font-size: 0.75rem;
}

:deep(.p-fileupload-label),
:deep(.p-fileupload-basic-content > span:not([class*="p-button"])) {
  font-size: 0.72rem;
  color: var(--p-text-muted-color);
}
:deep(.p-fileupload-basic .p-button .p-button-icon) {
  font-size: 0.75rem;
}

.data-table {
  flex: 1;
  min-height: 300px;
}
</style>
