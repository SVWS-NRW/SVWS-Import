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
      </div>
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="stammdaten">
          Stammdaten
          <Badge v-if="store.totalCount > 0" :value="store.totalCount" severity="secondary" class="tab-badge" />
        </Tab>
        <Tab value="schulbesuch">
          Schulbesuch
          <Badge v-if="sbStore.totalCount > 0" :value="sbStore.totalCount" severity="secondary" class="tab-badge" />
        </Tab>
      </TabList>

      <TabPanels>
        <!-- ── Stammdaten ─────────────────────────────────────────────── -->
        <TabPanel value="stammdaten">
          <div class="tab-content">
            <div class="tab-actions">
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
              <ImportStats
                :total="store.totalCount"
                :valid="store.validCount"
                :errors="store.errorCount"
                :sent="store.sentCount"
              />
              <div class="action-buttons">
                <FileUpload
                  :key="fileKey"
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
              :tooltipShowDelay="400"
              :rowClassRules="rowClassRules"
              :getRowId="getRowId"
              rowSelection="multiple"
              :suppressRowClickSelection="true"
              @cell-value-changed="onCellChanged"
              @grid-ready="onGridReady"
              @selection-changed="onSelectionChanged"
              :animateRows="true"
              :stopEditingWhenCellsLoseFocus="true"
            />

            <ColumnMappingDialog
              v-if="showMappingDialog"
              :unmappedHeaders="store.unmappedHeaders"
              :sampleRows="store.rows.slice(0, 3)"
              @confirm="onMappingConfirm"
              @skip="showMappingDialog = false"
            />
          </div>
        </TabPanel>

        <!-- ── Schulbesuch ────────────────────────────────────────────── -->
        <TabPanel value="schulbesuch">
          <div class="tab-content">
            <div class="tab-actions">
              <ImportStats
                :total="sbStore.totalCount"
                :valid="sbStore.validCount"
                :errors="sbStore.errorCount"
                :sent="sbStore.sentCount"
              />
              <div class="action-buttons">
                <Button
                  v-tooltip.top="'Schülerliste neu aus Datenbank laden'"
                  icon="pi pi-refresh"
                  severity="secondary"
                  size="small"
                  text
                  :loading="sbStore.lookupLoading"
                  @click="handleReloadLookup"
                />
                <FileUpload
                  :key="sbFileKey"
                  mode="basic"
                  :auto="false"
                  :multiple="false"
                  accept=".csv,.dat"
                  chooseLabel="Datei laden"
                  chooseIcon="pi pi-folder-open"
                  :maxFileSize="10000000"
                  :disabled="sbParsing"
                  @select="onSbFileSelect"
                />
                <Button
                  :label="sbStore.uploading ? `${sbStore.uploadProgress} / ${sbStore.uploadTotal}` : sbSelectedCount > 0 ? `${sbSelectedCount} senden` : 'Alles senden'"
                  icon="pi pi-upload"
                  size="small"
                  :disabled="sbStore.validCount === 0 || sbStore.uploading"
                  :loading="sbStore.uploading"
                  @click="handleSbUploadAll"
                />
                <Button
                  :label="sbStore.uploading ? 'Stoppen' : 'Leeren'"
                  :icon="sbStore.uploading ? 'pi pi-stop' : 'pi pi-trash'"
                  :severity="sbStore.uploading ? 'warn' : 'danger'"
                  text
                  size="small"
                  @click="sbStore.uploading ? sbStore.stopUpload() : confirmSbClear()"
                />
              </div>
            </div>

            <Message v-if="sbLookupError" severity="warn" :closable="true" @close="sbLookupError = ''">
              {{ sbLookupError }}
            </Message>
            <Message v-if="sbParseError" severity="error" :closable="true" @close="sbParseError = ''">
              {{ sbParseError }}
            </Message>
            <Message v-if="sbUploadResult" :severity="sbUploadResult.failed > 0 ? 'warn' : 'success'" :closable="true" @close="sbUploadResult = null">
              {{ sbUploadResult.sent }} Schulbesuchsdaten übertragen
              <span v-if="sbUploadResult.failed > 0">, {{ sbUploadResult.failed }} fehlgeschlagen</span>
            </Message>

            <Message v-if="sbStore.rows.length === 0" severity="info" :closable="false" class="hint-msg">
              CSV-Datei mit den Spalten <strong>Nachname</strong>, <strong>Vorname</strong>,
              <strong>Geburtsdatum</strong> und gewünschten Schulbesuchsfeldern laden.
              Der Schüler wird anhand dieser drei Pflichtfelder in der Datenbank gesucht.
            </Message>

            <ag-grid-vue
              v-if="sbStore.rows.length > 0"
              :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-table']"
              :rowData="sbStore.rows"
              :columnDefs="sbColumnDefs"
              :defaultColDef="defaultColDef"
              :tooltipShowDelay="400"
              :rowClassRules="sbRowClassRules"
              :getRowId="getSbRowId"
              rowSelection="multiple"
              :suppressRowClickSelection="true"
              @cell-value-changed="onSbCellChanged"
              @grid-ready="onSbGridReady"
              @selection-changed="onSbSelectionChanged"
              :animateRows="true"
              :stopEditingWhenCellsLoseFocus="true"
            />
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
import { ModuleRegistry, type ColDef, type GetRowIdParams, type CellValueChangedEvent, type GridReadyEvent, type GridApi } from '@ag-grid-community/core'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Badge from 'primevue/badge'
import Tabs from 'primevue/tabs'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useSchuelerStore } from '@/stores/schueler'
import { useSchuleStore } from '@/stores/schule'
import { useSchulbesuchStore } from '@/stores/schulbesuch'
import { useDarkMode } from '@/composables/useDarkMode'
import { type SchuelerImportRow } from '@/models/Schueler'
import { type SchuelerSchulbesuchImportRow } from '@/models/SchuelerSchulbesuch'
import ImportStats from '@/components/ImportStats.vue'
import ColumnMappingDialog from '@/components/ColumnMappingDialog.vue'
import { parseSchuelerCsv } from '@/utils/csvParser'
import { parseSchuelerXlsx } from '@/utils/xlsxParser'
import { parseSchuelerSchulbesuchCsv } from '@/utils/csvParser'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const router = useRouter()
const store = useSchuelerStore()
const schuleStore = useSchuleStore()
const sbStore = useSchulbesuchStore()
const confirm = useConfirm()
const { isDark } = useDarkMode()

const activeTab = ref('stammdaten')

// ── Stammdaten ────────────────────────────────────────────────────────────────

const uploadResult = ref<{ sent: number; failed: number } | null>(null)
const parseError = ref('')
const parsing = ref(false)
const fileKey = ref(0)
const showMappingDialog = ref(false)
const gridApi = ref<GridApi | null>(null)
const selectedCount = ref(0)

function onGridReady(params: GridReadyEvent): void {
  gridApi.value = params.api
}

function onSelectionChanged(): void {
  selectedCount.value = gridApi.value?.getSelectedRows().length ?? 0
}

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

function withHeaderTooltips<T>(defs: ColDef<T>[]): ColDef<T>[] {
  return defs.map(c => ({ ...c, headerTooltip: c.headerTooltip ?? c.headerName }))
}

const columnDefs = computed<ColDef<SchuelerImportRow>[]>(() => {
  const has = (field: keyof SchuelerImportRow) =>
    store.rows.some(r => r[field] !== '')

  return withHeaderTooltips([
    {
      field: 'nachname',
      headerName: 'Nachname',
      pinned: 'left',
      flex: 1.5,
      minWidth: 120,
      checkboxSelection: true,
      headerCheckboxSelection: true,
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
    { field: 'geburtsdatum',              headerName: 'Geburtsdatum',           width: 140, pinned: 'left' },
    { field: 'alleVornamen',              headerName: 'Alle Vornamen',          width: 150 },
    { field: 'geburtsname',               headerName: 'Geburtsname',            width: 130 },
    { field: 'geburtsort',                headerName: 'Geburtsort',             width: 120 },
    { field: 'geburtsland',               headerName: 'Geburtsland',            width: 120,  hide: !has('geburtsland') },
    { field: 'geschlecht',                headerName: 'Geschlecht',             width: 110 },
    { field: 'staatsangehoerigkeitID',    headerName: 'Staatsangehörigkeit',    width: 170 },
    { field: 'staatsangehoerigkeit2ID',   headerName: 'Staatsangehörigkeit 2',  width: 170,  hide: !has('staatsangehoerigkeit2ID') },
    { field: 'religionID',                headerName: 'Konfession',             width: 160 },
    { field: 'religionKuerzel',           headerName: 'Konfessionskürzel',      width: 140,  hide: !has('religionKuerzel') },
    { field: 'druckeKonfessionAufZeugnisse', headerName: 'Konfession/Zeugnis', width: 150,  hide: !has('druckeKonfessionAufZeugnisse') },
    { field: 'religionanmeldung',         headerName: 'Anmeld. Religion',       width: 150,  hide: !has('religionanmeldung') },
    { field: 'religionabmeldung',         headerName: 'Abmeld. Religion',       width: 150,  hide: !has('religionabmeldung') },
    { field: 'hatMigrationshintergrund',  headerName: 'Migrationshintergrund',  width: 170,  hide: !has('hatMigrationshintergrund') },
    { field: 'zuzugsjahr',                headerName: 'Zuzugsjahr',             width: 110,  hide: !has('zuzugsjahr') },
    { field: 'verkehrspracheFamilie',     headerName: 'Verkehrssprache',        width: 150,  hide: !has('verkehrspracheFamilie') },
    { field: 'geburtslandVater',          headerName: 'Geburtsland Vater',      width: 150,  hide: !has('geburtslandVater') },
    { field: 'geburtslandMutter',         headerName: 'Geburtsland Mutter',     width: 150,  hide: !has('geburtslandMutter') },
    { field: 'strassenname',              headerName: 'Straße',                 width: 180 },
    { field: 'hausnummer',                headerName: 'Hausnr.',                width: 90 },
    { field: 'hausnummerZusatz',          headerName: 'Hausnr. Zusatz',         width: 120,  hide: !has('hausnummerZusatz') },
    { field: 'plz',                       headerName: 'PLZ',                    width: 80 },
    { field: 'ort',                       headerName: 'Ort',                    width: 130 },
    { field: 'ortsteil',                  headerName: 'Ortsteil',               width: 110 },
    { field: 'telefon',                   headerName: 'Telefon',                width: 140 },
    { field: 'telefonMobil',              headerName: 'Mobiltelefon',           width: 140,  hide: !has('telefonMobil') },
    { field: 'email',                     headerName: 'E-Mail',                 width: 180 },
    { field: 'emailSchule',               headerName: 'E-Mail Schule',          width: 180,  hide: !has('emailSchule') },
    { field: 'klasse',                    headerName: 'Klasse',                 width: 100 },
    { field: 'jahrgang',                  headerName: 'Jahrgang',               width: 110 },
    { field: 'schulgliederung',           headerName: 'Schulgliederung',        width: 150 },
    { field: 'anmeldedatum',              headerName: 'Anmeldedatum',           width: 150 },
    { field: 'aufnahmedatum',             headerName: 'Aufnahmedatum',          width: 150 },
    { field: 'beginnBildungsgang',        headerName: 'Beginn Bildungsgang',    width: 170 },
    { field: 'dauerBildungsgang',         headerName: 'Dauer Bildungsgang',     width: 140,  hide: !has('dauerBildungsgang') },
    { field: 'externeSchulNr',            headerName: 'Externe Schulnr.',       width: 140,  hide: !has('externeSchulNr') },
    { field: 'beruf',                     headerName: 'Beruf',                  width: 130,  hide: !has('beruf') },
    {
      field: 'status',
      headerName: 'Schülerstatus',
      width: 140,
      hide: !has('status'),
      valueFormatter: (p: { value: string }) => {
        const labels: Record<string, string> = {
          '0': 'Aufnahme', '1': 'Warteliste', '2': 'Aktiv',
          '3': 'Beurlaubt', '6': 'Extern', '8': 'Abschluss',
          '9': 'Abgang', '10': 'Ehemalige',
        }
        return labels[p.value] ?? p.value
      },
    },
    { field: 'hatMasernimpfnachweis',     headerName: 'Masernimpfnachweis',     width: 160,  hide: !has('hatMasernimpfnachweis') },
    { field: 'keineAuskunftAnDritte',     headerName: 'Keine Auskunft',         width: 130,  hide: !has('keineAuskunftAnDritte') },
    { field: 'erhaeltSchuelerBAFOEG',     headerName: 'Schüler-BAföG',          width: 130,  hide: !has('erhaeltSchuelerBAFOEG') },
    { field: 'erhaeltMeisterBAFOEG',      headerName: 'Meister-BAföG',          width: 130,  hide: !has('erhaeltMeisterBAFOEG') },
    {
      headerName: 'Importstatus',
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
  ])
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

;(window as unknown as Record<string, unknown>).__deleteSchueler = (id: string) => {
  store.deleteRow(id)
}

function onMappingConfirm(mapping: Record<string, string>): void {
  showMappingDialog.value = false
  store.applyColumnMapping(mapping)
}

async function handleUploadAll(): Promise<void> {
  uploadResult.value = null
  const selected = gridApi.value?.getSelectedRows() ?? []
  const selectedIds = selected.length > 0 ? new Set(selected.map((r: { _id: string }) => r._id)) : undefined
  uploadResult.value = await store.uploadAll(selectedIds)
}

function confirmClear(): void {
  confirm.require({
    message: 'Alle Schülerdaten verwerfen?',
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, leeren',
    rejectLabel: 'Abbrechen',
    accept: () => { store.clear(); fileKey.value++ },
  })
}

// ── Schulbesuch ───────────────────────────────────────────────────────────────

const sbParseError = ref('')
const sbParsing = ref(false)
const sbLookupError = ref('')
const sbUploadResult = ref<{ sent: number; failed: number } | null>(null)
const sbGridApi = ref<GridApi | null>(null)
const sbFileKey = ref(0)
const sbSelectedCount = ref(0)

function onSbGridReady(params: GridReadyEvent): void {
  sbGridApi.value = params.api
}

function onSbSelectionChanged(): void {
  sbSelectedCount.value = sbGridApi.value?.getSelectedRows().length ?? 0
}

async function onSbFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  sbParsing.value = true
  sbParseError.value = ''
  sbLookupError.value = ''
  try {
    const rows = await parseSchuelerSchulbesuchCsv(file)
    if (rows.length === 0) throw new Error('Keine Datensätze gefunden')

    if (!sbStore.lookupLoaded) {
      const result = await sbStore.loadSchuelerLookup()
      if (result.error) sbLookupError.value = `Schülerliste konnte nicht geladen werden: ${result.error} — Abgleich nicht möglich.`
    }

    sbStore.setRows(rows)
  } catch (e) {
    sbParseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    sbParsing.value = false
  }
}

async function handleReloadLookup(): Promise<void> {
  sbLookupError.value = ''
  const result = await sbStore.loadSchuelerLookup(true)
  if (result.error) {
    sbLookupError.value = result.error
  } else if (sbStore.rows.length > 0) {
    sbStore.resolveAndValidate()
  }
}

async function handleSbUploadAll(): Promise<void> {
  sbUploadResult.value = null
  const selected = sbGridApi.value?.getSelectedRows() ?? []
  const selectedIds = selected.length > 0 ? new Set(selected.map((r: { _id: string }) => r._id)) : undefined
  sbUploadResult.value = await sbStore.uploadAll(selectedIds)
}

function confirmSbClear(): void {
  confirm.require({
    message: 'Alle Schulbesuch-Importdaten verwerfen?',
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, leeren',
    rejectLabel: 'Abbrechen',
    accept: () => { sbStore.clear(); sbFileKey.value++ },
  })
}

function onSbCellChanged(event: CellValueChangedEvent<SchuelerSchulbesuchImportRow>): void {
  if (event.data) {
    sbStore.updateRow(event.data._id, { [event.colDef.field as string]: event.newValue })
  }
}

;(window as unknown as Record<string, unknown>).__deleteSchulbesuch = (id: string) => {
  sbStore.deleteRow(id)
}

function getSbRowId(params: GetRowIdParams<SchuelerSchulbesuchImportRow>): string {
  return params.data._id
}

const sbRowClassRules = {
  'row-sent':  (params: { data: SchuelerSchulbesuchImportRow }) => params.data._sent,
  'row-error': (params: { data: SchuelerSchulbesuchImportRow }) => !params.data._valid && !params.data._sent,
}

const sbColumnDefs = computed<ColDef<SchuelerSchulbesuchImportRow>[]>(() => {
  const has = (field: keyof SchuelerSchulbesuchImportRow) =>
    sbStore.rows.some(r => !!r[field])

  return withHeaderTooltips([
    {
      field: 'nachname',
      headerName: 'Nachname',
      pinned: 'left',
      width: 140,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      cellStyle: (p) => p.data?._errors.some(e => e.includes('Nachname')) ? { background: '#fee2e2' } : null,
    },
    {
      field: 'vorname',
      headerName: 'Vorname',
      pinned: 'left',
      width: 130,
      cellStyle: (p) => p.data?._errors.some(e => e.includes('Vorname')) ? { background: '#fee2e2' } : null,
    },
    {
      field: 'geburtsdatum',
      headerName: 'Geburtsdatum',
      pinned: 'left',
      width: 130,
      cellStyle: (p) => p.data?._errors.some(e => e.includes('Geburtsdatum')) ? { background: '#fee2e2' } : null,
    },
    {
      headerName: 'Abgleich',
      width: 110,
      pinned: 'left',
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        switch (params.data._lookupStatus) {
          case 'ok':        return `<span style="color:#22c55e" title="ID: ${params.data._schuelerId}">✔ Gefunden</span>`
          case 'not_found': return '<span style="color:#ef4444">✖ Nicht gefunden</span>'
          case 'ambiguous': return '<span style="color:#f59e0b">⚠ Nicht eindeutig</span>'
          default:          return '<span style="color:#94a3b8">⋯ Ausstehend</span>'
        }
      },
    },
    // ── Vorige Schule ─────────────────────────────────────────────────────────
    {
      field: 'vorherigeSchule',
      headerName: 'Vorige Schule (Schulnr.)',
      width: 180,
      hide: !has('vorherigeSchule'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const nr = params.data.vorherigeSchule?.trim()
        if (!nr) return ''
        switch (params.data._vorherigeSchuleStatus) {
          case 'found': return `${nr} <span style="color:#22c55e" title="Schule gefunden">✔</span>`
          case 'new':   return `${nr} <span style="color:#f59e0b" title="Schule wird neu angelegt">+neu</span>`
          default:      return nr
        }
      },
    },
    { field: 'vorigeAllgHerkunft',        headerName: 'Herkunft vorige Schule',  width: 180,  hide: !has('vorigeAllgHerkunft') },
    { field: 'vorigeEntlassdatum',        headerName: 'Entlassung vorige Schule', width: 170, hide: !has('vorigeEntlassdatum') },
    {
      field: 'vorigeEntlassjahrgang', headerName: 'Entlassjahrgang vor. Sch.', width: 170,
      hide: !has('vorigeEntlassjahrgang'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const jg = params.data.vorigeEntlassjahrgang?.trim()
        if (!jg) return ''
        switch (params.data._vorigeEntlassJahrgangStatus) {
          case 'valid':               return `${jg} <span style='color:#22c55e' title='Gültiger Jahrgang'>✔</span>`
          case 'invalid_for_schulform': return `${jg} <span style='color:#f59e0b' title='Jahrgang nicht für die Schulform der Vorgängerschule gültig'>⚠</span>`
          case 'invalid_kuerzel':     return `${jg} <span style='color:#ef4444' title='Kein gültiges Jahrgangs-Kürzel'>✘</span>`
          default:                    return jg
        }
      },
    },
    { field: 'vorigeArtLetzteVersetzung', headerName: 'Art letzte Versetzung',   width: 160,  hide: !has('vorigeArtLetzteVersetzung') },
    {
      field: 'vorigeEntlassgrundID', headerName: 'Entlassgrund vor. Sch.', width: 160,
      hide: !has('vorigeEntlassgrundID'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const v = params.data.vorigeEntlassgrundID?.trim()
        if (!v) return ''
        return params.data._vorigeEntlassgrundStatus === 'invalid'
          ? `${v} <span style='color:#ef4444' title='Keine gültige Entlassgrund-ID'>✘</span>`
          : `${v} <span style='color:#22c55e' title='Gültige ID'>✔</span>`
      },
    },
    { field: 'vorigeBemerkung',           headerName: 'Bemerkung vorige Schule', width: 180,  hide: !has('vorigeBemerkung') },
    { field: 'vorigeAbschlussartID',      headerName: 'Abschluss vorige Schule', width: 170,  hide: !has('vorigeAbschlussartID') },
    // ── Entlassung von dieser Schule ──────────────────────────────────────────
    { field: 'entlassungDatum',           headerName: 'Entlassungsdatum',        width: 150,  hide: !has('entlassungDatum') },
    {
      field: 'entlassjahrgang', headerName: 'Entlassjahrgang', width: 150,
      hide: !has('entlassjahrgang'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const jg = params.data.entlassjahrgang?.trim()
        if (!jg) return ''
        return params.data._entlassJahrgangStatus === 'invalid'
          ? `${jg} <span style='color:#ef4444' title='Kein gültiger Jahrgang für diese Schule'>✘</span>`
          : `${jg} <span style='color:#22c55e' title='Gültiger Jahrgang'>✔</span>`
      },
    },
    {
      field: 'entlassungGrundID', headerName: 'Entlassungsgrund', width: 150,
      hide: !has('entlassungGrundID'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const v = params.data.entlassungGrundID?.trim()
        if (!v) return ''
        return params.data._entlassungGrundStatus === 'invalid'
          ? `${v} <span style='color:#ef4444' title='Keine gültige Entlassgrund-ID'>✘</span>`
          : `${v} <span style='color:#22c55e' title='Gültige ID'>✔</span>`
      },
    },
    { field: 'entlassungAbschlussartID',  headerName: 'Abschluss Entlassung',    width: 160,  hide: !has('entlassungAbschlussartID') },
    // ── Aufnehmende Schule ────────────────────────────────────────────────────
    {
      field: 'aufnehmendeSchule', headerName: 'Aufnehmende Schule (Schulnr.)', width: 190,
      hide: !has('aufnehmendeSchule'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const nr = params.data.aufnehmendeSchule?.trim()
        if (!nr) return ''
        switch (params.data._aufnehmendeSchuleStatus) {
          case 'found': return `${nr} <span style='color:#22c55e' title='Schule gefunden'>✔</span>`
          case 'new':   return `${nr} <span style='color:#f59e0b' title='Schule wird neu angelegt'>+neu</span>`
          default:      return nr
        }
      },
    },
    { field: 'aufnehmendWechseldatum',    headerName: 'Wechseldatum aufnehm.',   width: 160,  hide: !has('aufnehmendWechseldatum') },
    { field: 'aufnehmendBestaetigt',      headerName: 'Wechsel bestätigt',       width: 140,  hide: !has('aufnehmendBestaetigt') },
    // ── Grundschule ───────────────────────────────────────────────────────────
    { field: 'grundschuleEinschulungsjahr',             headerName: 'Einschulungsjahr GS',        width: 160,  hide: !has('grundschuleEinschulungsjahr') },
    { field: 'grundschuleEinschulungsartID',             headerName: 'Einschulungsart GS (ID)',     width: 170,  hide: !has('grundschuleEinschulungsartID') },
    { field: 'idGrundschuleJahreEingangsphase',          headerName: 'Jahre Eingangsphase (ID)',    width: 175,  hide: !has('idGrundschuleJahreEingangsphase') },
    {
      field: 'kuerzelGrundschuleUebergangsempfehlung', headerName: 'Übergangsempfehlung GS', width: 175,
      hide: !has('kuerzelGrundschuleUebergangsempfehlung'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const v = params.data.kuerzelGrundschuleUebergangsempfehlung?.trim()
        if (!v) return ''
        return params.data._uebergangsempfehlungStatus === 'invalid'
          ? `${v} <span style='color:#ef4444' title='Kein gültiges Kürzel (Uebergangsempfehlung)'>✘</span>`
          : `${v} <span style='color:#22c55e' title='Gültiges Kürzel'>✔</span>`
      },
    },
    // ── Sekundarstufe ─────────────────────────────────────────────────────────
    { field: 'sekIWechsel',               headerName: 'Wechsel Sek I',           width: 120,  hide: !has('sekIWechsel') },
    { field: 'sekIErsteSchulform',        headerName: 'Erste Schulform Sek I',   width: 160,  hide: !has('sekIErsteSchulform') },
    { field: 'sekIIWechsel',              headerName: 'Wechsel Sek II',          width: 120,  hide: !has('sekIIWechsel') },
    // ── Kindergarten ──────────────────────────────────────────────────────────
    { field: 'idDauerKindergartenbesuch', headerName: 'Dauer Kindergarten (ID)', width: 170,  hide: !has('idDauerKindergartenbesuch') },
    { field: 'idKindergarten',            headerName: 'Kindergarten (ID)',        width: 140,  hide: !has('idKindergarten') },
    // ── Sprachförderung ───────────────────────────────────────────────────────
    { field: 'verpflichtungSprachfoerderkurs',       headerName: 'Sprachförderpflicht',    width: 155, hide: !has('verpflichtungSprachfoerderkurs') },
    { field: 'teilnahmeSprachfoerderkurs',           headerName: 'Sprachförderteilnahme',  width: 165, hide: !has('teilnahmeSprachfoerderkurs') },
    {
      field: 'schluesselHoechsterSchulabschluss', headerName: 'Höchster Abschluss', width: 150,
      hide: !has('schluesselHoechsterSchulabschluss'),
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
        const v = params.data.schluesselHoechsterSchulabschluss?.trim()
        if (!v) return ''
        return params.data._hoechsterAbschlussStatus === 'invalid'
          ? `${v} <span style='color:#ef4444' title='Kein gültiger Schlüssel (SchulabschlussAllgemeinbildend)'>✘</span>`
          : `${v} <span style='color:#22c55e' title='Gültiger Schlüssel'>✔</span>`
      },
    },
    {
      headerName: 'Importstatus',
      width: 110,
      editable: false,
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) => {
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
      cellRenderer: (params: { data: SchuelerSchulbesuchImportRow }) =>
        params.data._sent
          ? ''
          : `<button onclick="window.__deleteSchulbesuch('${params.data._id}')" style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem" title="Zeile löschen">✕</button>`,
    },
  ])
})
</script>

<style scoped>
.table-view {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.tab-badge {
  margin-left: 0.4rem;
  font-size: 0.7rem;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  min-height: 0;
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

.data-table {
  flex: 1;
  min-height: 400px;
}

.hint-msg {
  font-size: 0.82rem;
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

:deep(.tab-actions .p-select) {
  font-size: 0.72rem;
}
:deep(.tab-actions .p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.tab-actions .p-select .p-select-dropdown) {
  width: 1.25rem;
}
:deep(.tab-actions .p-select .p-select-dropdown .p-icon) {
  width: 0.65rem;
  height: 0.65rem;
}

:deep(.p-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.p-tabpanels) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.p-tabpanel) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
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

.row-sent  { opacity: 0.6; }
.row-error { background-color: #fff5f5 !important; }
.dark .row-error { background-color: #3b0c0c !important; }

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
