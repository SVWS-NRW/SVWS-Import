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
        <h2>Klassendaten</h2>
      </div>
      <ImportStats
        :total="store.totalCount"
        :valid="store.validCount"
        :errors="store.errorCount"
        :sent="store.sentCount"
      />
      <div class="header-actions">
        <div class="abschnitt-field">
          <label>Schuljahresabschnitt</label>
          <Select
            v-if="schuleStore.loaded"
            v-model="store.idSchuljahresabschnitt"
            :options="schuleStore.abschnitteOptions"
            optionLabel="label"
            optionValue="id"
            placeholder="Abschnitt wählen"
            style="width: 220px"
          />
          <InputNumber
            v-else
            v-model="store.idSchuljahresabschnitt"
            :min="1"
            style="width: 130px"
          />
        </div>
        <Button
          label="DB laden"
          icon="pi pi-refresh"
          severity="secondary"
          :loading="store.loadingExisting"
          @click="handleLoadExisting"
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
        @cell-value-changed="onCellChanged"
        @grid-ready="onImportGridReady"
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
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useKlassenStore } from '@/stores/klassen'
import { useSchuleStore } from '@/stores/schule'
import { useJahrgaengeStore } from '@/stores/jahrgaenge'
import { type KlasseImportRow } from '@/models/Klassen'
import ImportStats from '@/components/ImportStats.vue'
import { useDarkMode } from '@/composables/useDarkMode'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useKlassenStore()
const schuleStore = useSchuleStore()
const jahrgaengeStore = useJahrgaengeStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()
const importGridApi = ref<GridApi | null>(null)

function onImportGridReady(params: { api: GridApi }): void {
  importGridApi.value = params.api
}

onMounted(async () => {
  if (schuleStore.loaded) {
    const defaultId = schuleStore.aktuellerAbschnittId ?? schuleStore.abschnitteOptions[0]?.id ?? null
    if (defaultId !== null) store.idSchuljahresabschnitt = defaultId
  }
  if (jahrgaengeStore.existingJahrgaenge.length === 0) {
    await jahrgaengeStore.loadExisting()
  }
  store.resolveJahrgaenge(jahrgaengeStore.existingJahrgaenge)
  importGridApi.value?.refreshCells({ force: true })
})
const uploadResult = ref<{ sent: number; failed: number } | null>(null)
const loadError = ref('')

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
  { field: 'klassenlehrer',    headerName: 'Klassenlehrer', width: 130 },
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
  const result = await store.loadExisting()
  if (result.error) loadError.value = result.error
  store.resolveJahrgaenge(jahrgaengeStore.existingJahrgaenge)
}

async function doUpload(): Promise<void> {
  uploadResult.value = null
  uploadResult.value = await store.uploadAll()
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
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
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

.data-table {
  flex: 1;
  min-height: 300px;
}
</style>
