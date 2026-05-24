<template>
  <div class="table-view">
    <div class="table-header">
      <div class="header-left">
        <div class="header-title-row">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            @click="router.push({ name: 'import' })"
            aria-label="Zurück"
          />
          <h2>Schülerdaten</h2>
        </div>
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
          :label="store.uploading ? `${store.uploadProgress} / ${store.uploadTotal}` : 'Alles senden'"
          icon="pi pi-upload"
          :disabled="store.validCount === 0 || store.uploading"
          :loading="store.uploading"
          @click="handleUploadAll"
        />
        <Button
          :label="store.uploading ? 'Stoppen' : 'Leeren'"
          :icon="store.uploading ? 'pi pi-stop' : 'pi pi-trash'"
          :severity="store.uploading ? 'warn' : 'danger'"
          text
          @click="store.uploading ? store.stopUpload() : confirmClear()"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry, type ColDef, type GetRowIdParams, type CellValueChangedEvent } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuleStore } from '@/stores/schule'
import { useDarkMode } from '@/composables/useDarkMode'
import { type SchuelerImportRow } from '@/models/Schueler'
import ImportStats from '@/components/ImportStats.vue'
import { parseSchuelerCsv } from '@/utils/csvParser'
import { parseSchuelerXlsx } from '@/utils/xlsxParser'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useSchuelerStore()
const schuleStore = useSchuleStore()
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
    const rows = isXlsx ? await parseSchuelerXlsx(file) : await parseSchuelerCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    store.setRows(rows)
    store.validateAll()
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    parsing.value = false
  }
}

onMounted(() => {
  if (!schuleStore.loaded) return
  const defaultId = schuleStore.aktuellerAbschnittId ?? schuleStore.abschnitteOptions[0]?.id ?? null
  if (defaultId !== null) store.idSchuljahresabschnitt = defaultId
})

const defaultColDef: ColDef = {
  editable: (params) => !params.data._sent,
  sortable: true,
  filter: true,
  resizable: true,
  minWidth: 80,
}

const columnDefs: ColDef<SchuelerImportRow>[] = [
  // ── Pflichtfelder ──────────────────────────────────────────────────────────
  {
    field: 'nachname',
    headerName: 'Nachname',
    pinned: 'left',
    flex: 1.5,
    minWidth: 120,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Nachname')) ? { background: '#fee2e2' } : null,
  },
  {
    field: 'vorname',
    headerName: 'Vorname',
    pinned: 'left',
    flex: 1.5,
    minWidth: 120,
    cellStyle: (p) => p.data?._errors.some(e => e.includes('Vorname')) ? { background: '#fee2e2' } : null,
  },
  // ── Personaldaten ──────────────────────────────────────────────────────────
  { field: 'geburtsdatum',           headerName: 'Geburtsdatum',          width: 140, pinned: 'left' },
  { field: 'alleVornamen',           headerName: 'Alle Vornamen',        width: 150 },
  { field: 'geburtsname',            headerName: 'Geburtsname',           width: 130 },
  { field: 'geburtsort',             headerName: 'Geburtsort',            width: 120 },
  { field: 'geschlecht',             headerName: 'Geschlecht',            width: 110 },
  { field: 'staatsangehoerigkeitID', headerName: 'Staatsangehörigkeit',   width: 170 },
  { field: 'religionID',             headerName: 'Konfession',            width: 160 },
  // ── Adresse ────────────────────────────────────────────────────────────────
  { field: 'strassenname',           headerName: 'Straße',                width: 180 },
  { field: 'hausnummer',             headerName: 'Hausnr.',               width: 90 },
  { field: 'plz',                    headerName: 'PLZ',                   width: 80 },
  { field: 'ort',                    headerName: 'Ort',                   width: 130 },
  { field: 'ortsteil',               headerName: 'Ortsteil',              width: 110 },
  // ── Kontakt ────────────────────────────────────────────────────────────────
  { field: 'telefon',                headerName: 'Telefon',               width: 140 },
  { field: 'email',                  headerName: 'E-Mail',                width: 180 },
  // ── Schulbezogen ──────────────────────────────────────────────────────────
  { field: 'klasse',                 headerName: 'Klasse',                width: 100 },
  { field: 'jahrgang',               headerName: 'Jahrgang',              width: 110 },
  { field: 'schulgliederung',        headerName: 'Schulgliederung',       width: 150 },
  { field: 'anmeldedatum',           headerName: 'Anmeldedatum',          width: 150 },
  { field: 'aufnahmedatum',          headerName: 'Aufnahmedatum',         width: 150 },
  { field: 'beginnBildungsgang',     headerName: 'Beginn Bildungsgang',   width: 170 },
  // ── Import-Status ─────────────────────────────────────────────────────────
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
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.header-title-row {
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
