<template>
  <div class="table-view">
    <div class="table-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="router.push({ name: 'import' })"
          aria-label="Zurück"
        />
        <h2>Lehrerdaten</h2>
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
          accept=".csv,.xlsx,.xls,.dat"
          chooseLabel="Datei laden"
          chooseIcon="pi pi-folder-open"
          :maxFileSize="10000000"
          :disabled="parsing"
          @select="onFileSelect"
        />
        <Button
          label="Alles senden"
          icon="pi pi-upload"
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

    <ag-grid-vue
      :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
      :rowData="store.rows"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :rowClassRules="rowClassRules"
      :getRowId="getRowId"
      @cell-value-changed="onCellChanged"
      :animateRows="true"
      :stopEditingWhenCellsLoseFocus="true"
    />

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, type ColDef, type GetRowIdParams, type CellValueChangedEvent } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useLehrerStore } from '@/stores/lehrer'
import { type LehrerImportRow } from '@/models/Lehrer'
import ImportStats from '@/components/ImportStats.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { parseLehrerCsv } from '@/utils/csvParser'
import { parseLehrerXlsx } from '@/utils/xlsxParser'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useLehrerStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()
const uploadResult = ref<{ sent: number; failed: number } | null>(null)
const parseError = ref('')
const parsing = ref(false)

async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsing.value = true
  parseError.value = ''
  try {
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
    const rows = isXlsx ? await parseLehrerXlsx(file) : await parseLehrerCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    store.setRows(rows)
    store.validateAll()
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    parsing.value = false
  }
}

const defaultColDef: ColDef = {
  editable: (params) => !params.data._sent,
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 80,
}

const columnDefs: ColDef<LehrerImportRow>[] = [
  { field: 'kuerzel', headerName: 'Kürzel', width: 100,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Kürzel')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'nachname', headerName: 'Nachname', flex: 1.5,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Nachname')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'vorname', headerName: 'Vorname', flex: 1.5,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Vorname')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'personalTyp', headerName: 'Typ', width: 130 },
  { field: 'anrede', headerName: 'Anrede', width: 100 },
  { field: 'titel', headerName: 'Titel', width: 90 },
  { field: 'geschlecht', headerName: 'Geschlecht', width: 110 },
  { field: 'geburtsdatum', headerName: 'Geburtsdatum', width: 140 },
  { field: 'emailDienstlich', headerName: 'E-Mail', flex: 2,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('E-Mail')) ? { background: isDark.value ? '#7f1d1d' : '#fee2e2' } : null },
  { field: 'telefon', headerName: 'Telefon', width: 140 },
  {
    headerName: 'Status',
    width: 100,
    editable: false,
    cellRenderer: (params: { data: LehrerImportRow }) => {
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
    cellRenderer: (params: { data: LehrerImportRow }) =>
      params.data._sent
        ? ''
        : `<button onclick="window.__deleteLehrer('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
  },
]

const rowClassRules = {
  'row-sent': (params: { data: LehrerImportRow }) => params.data._sent,
  'row-error': (params: { data: LehrerImportRow }) => !params.data._valid && !params.data._sent,
}

function getRowId(params: GetRowIdParams<LehrerImportRow>): string {
  return params.data._id
}

function onCellChanged(event: CellValueChangedEvent<LehrerImportRow>): void {
  if (event.data) {
    store.updateRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

;(window as unknown as Record<string, unknown>).__deleteLehrer = (id: string) => {
  store.deleteRow(id)
}

async function handleUploadAll(): Promise<void> {
  uploadResult.value = null
  uploadResult.value = await store.uploadAll()
}

function confirmClear(): void {
  confirm.require({
    message: 'Alle Lehrerdaten verwerfen?',
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
.row-sent { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }
.dark .row-error { background-color: #3b0c0c !important; }
</style>

<style scoped>
.table-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h2 {
  margin: 0;
  font-size: 1.4rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.data-table {
  flex: 1;
  min-height: 400px;
}
</style>
