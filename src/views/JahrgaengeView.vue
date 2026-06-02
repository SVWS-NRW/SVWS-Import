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
        <h2>Jahrgänge</h2>
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
          label="Alles senden"
          icon="pi pi-upload"
          size="small"
          :disabled="store.validCount === 0 || store.uploading"
          :loading="store.uploading"
          @click="handleUploadAll"
        />
        <Button
          label="Leeren"
          icon="pi pi-trash"
          severity="danger"
          text
          @click="confirmClear"
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
      <h3 class="section-title">Vorhandene Jahrgänge</h3>
      <ag-grid-vue
        :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'existing-table']"
        :rowData="store.existingJahrgaenge"
        :columnDefs="existingColDefs"
        :defaultColDef="readOnlyColDef"
        :animateRows="true"
      />
    </div>

    <div class="section import-section">
      <h3 class="section-title">Zu importierende Jahrgänge</h3>
      <ag-grid-vue
        :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
        :rowData="store.rows"
        :columnDefs="importColDefs"
        :defaultColDef="defaultColDef"
        :rowClassRules="rowClassRules"
        :getRowId="getRowId"
        @cell-value-changed="onCellChanged"
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
import { ModuleRegistry, type ColDef, type GetRowIdParams, type CellValueChangedEvent } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useJahrgaengeStore } from '@/stores/jahrgaenge'
import { type JahrgangImportRow } from '@/models/Jahrgaenge'
import ImportStats from '@/components/ImportStats.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { parseJahrgaengeCsv } from '@/utils/csvParser'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useJahrgaengeStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()
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
    const rows = await parseJahrgaengeCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    store.setRows(rows)
    store.validateAll()
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    parsing.value = false
  }
}

onMounted(async () => {
  const result = await store.loadExisting()
  if (result.error) loadError.value = result.error
})

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
  { field: 'bezeichnung',      headerName: 'Bezeichnung',  flex: 1 },
  { field: 'gliederung',       headerName: 'Gliederung',   width: 120 },
]

const importColDefs: ColDef<JahrgangImportRow>[] = [
  { field: 'kuerzel',          headerName: 'Kürzel',        width: 110,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Kürzel')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'kuerzelStatistik', headerName: 'Statistik-Kz.', width: 130 },
  { field: 'gliederung',       headerName: 'Gliederung',    flex: 1 },
  {
    headerName: 'Status',
    width: 110,
    editable: false,
    cellRenderer: (params: { data: JahrgangImportRow }) => {
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
    cellRenderer: (params: { data: JahrgangImportRow }) =>
      params.data._sent
        ? ''
        : `<button onclick="window.__deleteJahrgang('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
  },
]

const rowClassRules = {
  'row-sent':  (params: { data: JahrgangImportRow }) => params.data._sent,
  'row-error': (params: { data: JahrgangImportRow }) => !params.data._valid && !params.data._sent,
}

function getRowId(params: GetRowIdParams<JahrgangImportRow>): string {
  return params.data._id
}

function onCellChanged(event: CellValueChangedEvent<JahrgangImportRow>): void {
  if (event.data) {
    store.updateRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

;(window as unknown as Record<string, unknown>).__deleteJahrgang = (id: string) => {
  store.deleteRow(id)
}

async function handleUploadAll(): Promise<void> {
  uploadResult.value = null
  uploadResult.value = await store.uploadAll()
  if ((uploadResult.value?.sent ?? 0) > 0) {
    const result = await store.loadExisting()
    if (result.error) loadError.value = result.error
  }
}

function confirmClear(): void {
  confirm.require({
    message: 'Alle Jahrgangsdaten verwerfen?',
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
