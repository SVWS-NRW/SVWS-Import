<template>
  <div class="table-view">
    <div class="table-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          size="small"
          @click="router.push({ name: 'import' })"
          aria-label="Zurück"
        />
        <h2>Schülerdaten</h2>
        <Select
          v-if="schuleStore.loaded"
          v-model="store.idSchuljahresabschnitt"
          :options="schuleStore.abschnitteOptions"
          optionLabel="label"
          optionValue="id"
          placeholder="Abschnitt wählen"
          style="width: 160px"
          size="small"
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
          size="small"
          :disabled="store.validCount === 0 || store.uploading"
          :loading="store.uploading"
          @click="handleUploadAll"
        />
        <Button
          :label="store.uploading ? 'Stoppen' : 'Leeren'"
          :icon="store.uploading ? 'pi pi-stop' : 'pi pi-trash'"
          :severity="store.uploading ? 'warn' : 'danger'"
          text
          size="small"
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

    <ColumnMappingDialog
      v-if="showMappingDialog"
      :unmappedHeaders="store.unmappedHeaders"
      :sampleRows="store.rows.slice(0, 3)"
      @confirm="onMappingConfirm"
      @skip="showMappingDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import ColumnMappingDialog from '@/components/ColumnMappingDialog.vue'
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
const showMappingDialog = ref(false)

async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  parsing.value = true
  parseError.value = ''
  try {
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
    const { rows, unmappedHeaders } = isXlsx ? await parseSchuelerXlsx(file) : await parseSchuelerCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
    store.setRows(rows, unmappedHeaders)
    store.validateAll()
    if (unmappedHeaders.length > 0) showMappingDialog.value = true
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

const columnDefs = computed<ColDef<SchuelerImportRow>[]>(() => {
  const has = (field: keyof SchuelerImportRow) =>
    store.rows.some(r => r[field] !== '')

  return [
    // ── Pflichtfelder ────────────────────────────────────────────────────────
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
    // ── Personaldaten ────────────────────────────────────────────────────────
    { field: 'geburtsdatum',              headerName: 'Geburtsdatum',           width: 140, pinned: 'left' },
    { field: 'alleVornamen',              headerName: 'Alle Vornamen',          width: 150 },
    { field: 'geburtsname',               headerName: 'Geburtsname',            width: 130 },
    { field: 'geburtsort',                headerName: 'Geburtsort',             width: 120 },
    { field: 'geburtsland',               headerName: 'Geburtsland',            width: 120,  hide: !has('geburtsland') },
    { field: 'geschlecht',                headerName: 'Geschlecht',             width: 110 },
    { field: 'staatsangehoerigkeitID',    headerName: 'Staatsangehörigkeit',    width: 170 },
    { field: 'staatsangehoerigkeit2ID',   headerName: 'Staatsangehörigkeit 2',  width: 170,  hide: !has('staatsangehoerigkeit2ID') },
    // ── Religion ─────────────────────────────────────────────────────────────
    { field: 'religionID',                headerName: 'Konfession',             width: 160 },
    { field: 'religionKuerzel',           headerName: 'Konfessionskürzel',      width: 140,  hide: !has('religionKuerzel') },
    { field: 'druckeKonfessionAufZeugnisse', headerName: 'Konfession/Zeugnis', width: 150,  hide: !has('druckeKonfessionAufZeugnisse') },
    { field: 'religionanmeldung',         headerName: 'Anmeld. Religion',       width: 150,  hide: !has('religionanmeldung') },
    { field: 'religionabmeldung',         headerName: 'Abmeld. Religion',       width: 150,  hide: !has('religionabmeldung') },
    // ── Herkunft / Migration ─────────────────────────────────────────────────
    { field: 'hatMigrationshintergrund',  headerName: 'Migrationshintergrund',  width: 170,  hide: !has('hatMigrationshintergrund') },
    { field: 'zuzugsjahr',                headerName: 'Zuzugsjahr',             width: 110,  hide: !has('zuzugsjahr') },
    { field: 'verkehrspracheFamilie',     headerName: 'Verkehrssprache',        width: 150,  hide: !has('verkehrspracheFamilie') },
    { field: 'geburtslandVater',          headerName: 'Geburtsland Vater',      width: 150,  hide: !has('geburtslandVater') },
    { field: 'geburtslandMutter',         headerName: 'Geburtsland Mutter',     width: 150,  hide: !has('geburtslandMutter') },
    // ── Adresse ──────────────────────────────────────────────────────────────
    { field: 'strassenname',              headerName: 'Straße',                 width: 180 },
    { field: 'hausnummer',                headerName: 'Hausnr.',                width: 90 },
    { field: 'hausnummerZusatz',          headerName: 'Hausnr. Zusatz',         width: 120,  hide: !has('hausnummerZusatz') },
    { field: 'plz',                       headerName: 'PLZ',                    width: 80 },
    { field: 'ort',                       headerName: 'Ort',                    width: 130 },
    { field: 'ortsteil',                  headerName: 'Ortsteil',               width: 110 },
    // ── Kontakt ──────────────────────────────────────────────────────────────
    { field: 'telefon',                   headerName: 'Telefon',                width: 140 },
    { field: 'telefonMobil',              headerName: 'Mobiltelefon',           width: 140,  hide: !has('telefonMobil') },
    { field: 'email',                     headerName: 'E-Mail',                 width: 180 },
    { field: 'emailSchule',               headerName: 'E-Mail Schule',          width: 180,  hide: !has('emailSchule') },
    // ── Schulbezogen ─────────────────────────────────────────────────────────
    { field: 'klasse',                    headerName: 'Klasse',                 width: 100 },
    { field: 'jahrgang',                  headerName: 'Jahrgang',               width: 110 },
    { field: 'schulgliederung',           headerName: 'Schulgliederung',        width: 150 },
    { field: 'anmeldedatum',              headerName: 'Anmeldedatum',           width: 150 },
    { field: 'aufnahmedatum',             headerName: 'Aufnahmedatum',          width: 150 },
    { field: 'beginnBildungsgang',        headerName: 'Beginn Bildungsgang',    width: 170 },
    { field: 'dauerBildungsgang',         headerName: 'Dauer Bildungsgang',     width: 140,  hide: !has('dauerBildungsgang') },
    { field: 'externeSchulNr',            headerName: 'Externe Schulnr.',       width: 140,  hide: !has('externeSchulNr') },
    { field: 'beruf',                     headerName: 'Beruf',                  width: 130,  hide: !has('beruf') },
    // ── Sonstiges ────────────────────────────────────────────────────────────
    { field: 'hatMasernimpfnachweis',     headerName: 'Masernimpfnachweis',     width: 160,  hide: !has('hatMasernimpfnachweis') },
    { field: 'keineAuskunftAnDritte',     headerName: 'Keine Auskunft',         width: 130,  hide: !has('keineAuskunftAnDritte') },
    { field: 'erhaeltSchuelerBAFOEG',     headerName: 'Schüler-BAföG',          width: 130,  hide: !has('erhaeltSchuelerBAFOEG') },
    { field: 'erhaeltMeisterBAFOEG',      headerName: 'Meister-BAföG',          width: 130,  hide: !has('erhaeltMeisterBAFOEG') },
    // ── Import-Status ────────────────────────────────────────────────────────
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
    // ── Nicht zugeordnete Spalten (amber) ────────────────────────────────────
    ...store.unmappedHeaders.map(header => ({
      headerName: header,
      headerClass: 'col-unmapped-header',
      cellClass: 'col-unmapped-cell',
      editable: false,
      width: 130,
      sortable: true,
      filter: true,
      valueGetter: (params: { data?: SchuelerImportRow }) => params.data?._rawData?.[header] ?? '',
    })),
  ]
})

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

function onMappingConfirm(mapping: Record<string, string>): void {
  showMappingDialog.value = false
  store.applyColumnMapping(mapping)
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
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
}


.data-table {
  flex: 1;
  min-height: 400px;
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

:deep(.header-left .p-select) {
  font-size: 0.72rem;
}
:deep(.header-left .p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.header-left .p-select .p-select-dropdown) {
  width: 1.25rem;
}
:deep(.header-left .p-select .p-select-dropdown .p-icon) {
  width: 0.65rem;
  height: 0.65rem;
}
</style>

<style>
.p-select-overlay .p-select-option {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
.p-select-overlay .p-select-list-container {
  max-height: 200px;
}

.row-sent { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }

.ag-theme-quartz .col-unmapped-header .ag-header-cell-label,
.ag-theme-quartz .col-unmapped-header {
  background-color: #fef3c7 !important;
  color: #92400e !important;
}
.ag-theme-quartz-dark .col-unmapped-header .ag-header-cell-label,
.ag-theme-quartz-dark .col-unmapped-header {
  background-color: #78350f !important;
  color: #fef3c7 !important;
}
.col-unmapped-cell {
  background-color: #fffbeb !important;
}
.ag-theme-quartz-dark .col-unmapped-cell {
  background-color: #1c1100 !important;
}
</style>
