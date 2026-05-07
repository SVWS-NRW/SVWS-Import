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
        <h2>Schülerdaten</h2>
      </div>
      <ImportStats
        :total="store.totalCount"
        :valid="store.validCount"
        :errors="store.errorCount"
        :sent="store.sentCount"
      />
      <div class="header-actions">
        <div class="abschnitt-field">
          <label>Schuljahresabschnitt-ID</label>
          <InputNumber v-model="store.idSchuljahresabschnitt" :min="1" style="width: 130px" />
        </div>
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
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useSchuelerStore } from '@/stores/schueler'
import { useDarkMode } from '@/composables/useDarkMode'
import { type SchuelerImportRow } from '@/models/Schueler'
import ImportStats from '@/components/ImportStats.vue'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useSchuelerStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()
const uploadResult = ref<{ sent: number; failed: number } | null>(null)

const defaultColDef: ColDef = {
  editable: (params) => !params.data._sent,
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 80,
}

const columnDefs: ColDef<SchuelerImportRow>[] = [
  {
    field: 'nachname',
    headerName: 'Nachname',
    flex: 1.5,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Nachname')) ? { background: '#fee2e2' } : null,
  },
  {
    field: 'vorname',
    headerName: 'Vorname',
    flex: 1.5,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Vorname')) ? { background: '#fee2e2' } : null,
  },
  { field: 'alleVornamen', headerName: 'Alle Vornamen', flex: 1.5 },
  { field: 'geschlecht', headerName: 'Geschlecht', width: 110 },
  { field: 'geburtsdatum', headerName: 'Geburtsdatum', width: 140 },
  { field: 'klasse', headerName: 'Klasse', width: 100 },
  { field: 'jahrgang', headerName: 'Jahrgang', width: 110 },
  { field: 'aufnahmedatum', headerName: 'Aufnahmedatum', width: 150 },
  {
    headerName: 'Status',
    width: 100,
    editable: false,
    cellRenderer: (params: { data: SchuelerImportRow }) => {
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
    cellRenderer: (params: { data: SchuelerImportRow }) =>
      params.data._sent
        ? ''
        : `<button onclick="window.__deleteSchueler('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
  },
]

const rowClassRules = {
  'row-sent': (params: { data: SchuelerImportRow }) => params.data._sent,
  'row-error': (params: { data: SchuelerImportRow }) => !params.data._valid && !params.data._sent,
}

function getRowId(params: GetRowIdParams<SchuelerImportRow>): string {
  return params.data._id
}

function onCellChanged(event: CellValueChangedEvent<SchuelerImportRow>): void {
  if (event.data) {
    store.updateRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

// Globaler Handler für den Löschen-Button in der Zelle
;(window as unknown as Record<string, unknown>).__deleteSchueler = (id: string) => {
  store.deleteRow(id)
}

async function handleUploadAll(): Promise<void> {
  uploadResult.value = null
  uploadResult.value = await store.uploadAll()
}

function confirmClear(): void {
  confirm.require({
    message: 'Alle Schülerdaten verwerfen?',
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

.abschnitt-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.data-table {
  flex: 1;
  min-height: 400px;
}
</style>

<style>
.row-sent { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }
</style>
