<template>
  <div class="ankreuz-view">
    <div class="view-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          size="small"
          @click="router.push({ name: 'import' })"
          aria-label="Zurück"
        />
        <h2>Ankreuzkompetenzen verwalten</h2>
      </div>
      <div class="header-actions">
        <FileUpload
          ref="fileUploadRef"
          mode="basic"
          :auto="false"
          :multiple="false"
          accept=".csv,.xlsx,.xls"
          chooseLabel="Datei laden"
          chooseIcon="pi pi-folder-open"
          :maxFileSize="10000000"
          @select="onFileSelect"
        />
        <Button
          :label="importing ? importProgress : selectedImportRows.length > 0 ? `${selectedImportRows.length} senden` : 'Alles senden'"
          icon="pi pi-upload"
          size="small"
          :disabled="importRows.length === 0 || importing"
          :loading="importing"
          @click="handleImport"
        />
        <Button
          :label="importing ? 'Stoppen' : 'Leeren'"
          :icon="importing ? 'pi pi-stop' : 'pi pi-trash'"
          :severity="importing ? 'warn' : 'danger'"
          size="small"
          text
          @click="importing ? stopImport() : resetImport()"
        />
      </div>
      <Button
        v-tooltip.top="'Daten neu laden'"
        icon="pi pi-refresh"
        severity="secondary"
        size="small"
        text
        :loading="loading"
        @click="loadData"
      />
    </div>

    <Message v-if="successMsg" severity="success" :closable="true" @close="successMsg = ''">
      {{ successMsg }}
    </Message>
    <Message v-if="errorMsg" severity="error" :closable="true" @close="errorMsg = ''">
      {{ errorMsg }}
    </Message>

    <!-- Bestehende Ankreuzkompetenzen -->
    <section class="panel">
      <div class="section-head">
        <h3>
          Bestehende Ankreuzkompetenzen
          <Tag v-if="!loadingKompetenzen" :value="String(filteredKompetenzen.length)" severity="secondary" />
        </h3>
        <div class="filter-bar">
          <InputText v-model="filterText" placeholder="Text suchen…" size="small" class="filter-search" />
          <Select
            v-model="filterJahrgang"
            :options="jahrgangOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Jahrgang"
            size="small"
            showClear
            class="filter-select"
          />
          <Select
            v-model="filterFach"
            :options="fachOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Fach"
            size="small"
            showClear
            class="filter-select"
          />
          <Select
            v-model="filterAbschnitt"
            :options="abschnittOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Abschnitt"
            size="small"
            showClear
            class="filter-select"
          />
          <Button
            v-if="hasActiveFilter"
            icon="pi pi-filter-slash"
            label="Zurücksetzen"
            text
            severity="secondary"
            size="small"
            @click="resetFilter"
          />
        </div>
      </div>

      <div v-if="selectedKompetenzen.length > 0" class="selection-bar">
        <i class="pi pi-check-circle selection-icon" />
        <span>{{ selectedKompetenzen.length }} Kompetenz{{ selectedKompetenzen.length === 1 ? '' : 'en' }} ausgewählt</span>
        <Button
          :label="`${selectedKompetenzen.length} löschen`"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          :loading="deleting"
          @click="confirmDelete"
        />
        <Button
          label="Aufheben"
          text
          severity="secondary"
          size="small"
          @click="selectedKompetenzen = []"
        />
      </div>

      <DataTable
        v-model:selection="selectedKompetenzen"
        :value="filteredKompetenzen"
        :loading="loadingKompetenzen"
        dataKey="id"
        :paginator="filteredKompetenzen.length > 25"
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        stripedRows
        size="small"
        scrollable
        scrollHeight="400px"
        class="kompetenzen-table"
      >
        <Column selectionMode="multiple" style="width: 2.5rem; flex: 0 0 2.5rem" frozen />
        <Column header="Fach" style="width: 70px" sortable :sortField="(d) => faecherById.get(d.idFach ?? -1)?.kuerzel ?? ''">
          <template #body="{ data }">
            <span v-if="data.idFach">{{ faecherById.get(data.idFach)?.kuerzel ?? data.idFach }}</span>
            <Tag v-else-if="data.istASV" value="ASV" severity="info" />
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <Column header="Jg." style="width: 100px">
          <template #body="{ data }">
            <span v-if="data.jahrgaengezuordnung?.length">
              {{ data.jahrgaengezuordnung.map((z: { idJahrgang: number }) => jahrgaengeById.get(z.idJahrgang)?.kuerzel ?? z.idJahrgang).join(', ') }}
            </span>
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <Column header="Abschnitt" style="width: 90px" sortable :sortField="(d) => d.abschnitt">
          <template #body="{ data }">
            <Tag :value="ABSCHNITT_LABELS[data.abschnitt] ?? String(data.abschnitt)" severity="secondary" />
          </template>
        </Column>
        <Column field="floskelText" header="Text" />
        <Column header="Aktiv" style="width: 70px">
          <template #body="{ data }">
            <i v-if="data.istAktiv" class="pi pi-check status-ok" />
            <i v-else class="pi pi-times status-off" />
          </template>
        </Column>
        <Column field="sortierung" header="Sort." style="width: 65px" sortable />
        <template #empty>
          <div class="table-empty">
            <i class="pi pi-inbox table-empty-icon" />
            <span>{{
              loadingKompetenzen
                ? 'Lade Ankreuzkompetenzen…'
                : hasActiveFilter
                  ? 'Keine Treffer – Filter anpassen.'
                  : 'Keine Ankreuzkompetenzen vorhanden.'
            }}</span>
          </div>
        </template>
      </DataTable>
    </section>

    <!-- Importieren -->
    <section class="panel">
      <h3>Ankreuzkompetenzen importieren</h3>
      <p class="panel-hint">
        CSV- oder Excel-Datei mit Spalten: Text, Fach, Jahrgang, Abschnitt (1/2/3), istASV, Sortierung
      </p>

      <Message v-if="importError" severity="error" :closable="true" @close="importError = ''">
        {{ importError }}
      </Message>

      <template v-if="importRows.length > 0">
        <div class="import-summary">
          <Tag :value="`${importRows.length} Zeilen`" severity="info" />
          <span class="import-summary-hint">erkannt – bereit zum Importieren</span>
          <span v-if="importing" class="import-progress">{{ importProgress }}</span>
        </div>

        <DataTable
          v-model:selection="selectedImportRows"
          :value="importRows"
          dataKey="_id"
          selectionMode="multiple"
          :metaKeySelection="false"
          size="small"
          stripedRows
          :paginator="importRows.length > 25"
          :rows="25"
          :rowsPerPageOptions="[25, 50, 100]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          class="import-table"
        >
          <Column selectionMode="multiple" style="width: 2.5rem; flex: 0 0 2.5rem" frozen />
          <Column field="fach" header="Fach" style="width: 65px" />
          <Column field="jahrgang" header="Jg." style="width: 80px" />
          <Column field="abschnitt" header="Abschnitt" style="width: 80px" />
          <Column field="istASV" header="ASV" style="width: 55px" />
          <Column field="sortierung" header="Sort." style="width: 65px" />
          <Column field="text" header="Text" />
        </DataTable>
      </template>
    </section>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TooltipDirective from 'primevue/tooltip'
import Button from 'primevue/button'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import FileUpload from 'primevue/fileupload'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import {
  fetchAnkreuzkompetenzen,
  createAnkreuzkompetenz,
  deleteAnkreuzkompetenzen,
  addAnkreuzkompetenzJahrgangszuordnung,
  fetchJahrgaenge,
  fetchFaecher,
  type Ankreuzkompetenz,
} from '@/services/svwsService'
import { parseAnkreuzkompetenzCsv } from '@/utils/csvParser'
import { parseAnkreuzkompetenzXlsx } from '@/utils/xlsxParser'
import type { AnkreuzkompetenzImportRow } from '@/models/Ankreuzkompetenz'
import { ABSCHNITT_LABELS } from '@/models/Ankreuzkompetenz'
import type { JahrgangDetails } from '@/models/Jahrgaenge'
import type { FachDetails } from '@/models/Faecher'

const vTooltip = TooltipDirective

const router = useRouter()
const confirm = useConfirm()

const loading = ref(false)
const loadingKompetenzen = ref(false)
const deleting = ref(false)
const importing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const importError = ref('')

const kompetenzen = ref<Ankreuzkompetenz[]>([])
const jahrgaenge = ref<JahrgangDetails[]>([])
const faecher = ref<FachDetails[]>([])
const selectedKompetenzen = ref<Ankreuzkompetenz[]>([])

const filterText = ref('')
const filterJahrgang = ref<number | null>(null)
const filterFach = ref<number | null>(null)
const filterAbschnitt = ref<number | null>(null)

const fileUploadRef = ref()
const importRows = ref<AnkreuzkompetenzImportRow[]>([])
const selectedImportRows = ref<AnkreuzkompetenzImportRow[]>([])
const importProgress = ref('')
const importCancelled = ref(false)

const faecherById = computed(() => new Map(faecher.value.map(f => [f.id, f])))
const jahrgaengeById = computed(() => new Map(jahrgaenge.value.map(j => [j.id, j])))

// ── Filter ───────────────────────────────────────────────────────────────────
const filteredKompetenzen = computed(() => {
  let result = kompetenzen.value
  if (filterText.value) {
    const q = filterText.value.toLowerCase()
    result = result.filter(k => k.floskelText?.toLowerCase().includes(q))
  }
  if (filterJahrgang.value !== null) {
    result = result.filter(k =>
      k.jahrgaengezuordnung?.some(z => z.idJahrgang === filterJahrgang.value),
    )
  }
  if (filterFach.value !== null) {
    result = result.filter(k => k.idFach === filterFach.value)
  }
  if (filterAbschnitt.value !== null) {
    result = result.filter(k => k.abschnitt === filterAbschnitt.value)
  }
  return result
})

const hasActiveFilter = computed(
  () => !!(filterText.value || filterJahrgang.value !== null || filterFach.value !== null || filterAbschnitt.value !== null),
)

const jahrgangOptions = computed(() =>
  jahrgaenge.value.map(j => ({ label: j.kuerzel ?? String(j.id), value: j.id })),
)

const fachOptions = computed(() =>
  faecher.value
    .filter(f => kompetenzen.value.some(k => k.idFach === f.id))
    .sort((a, b) => (a.kuerzel ?? '').localeCompare(b.kuerzel ?? ''))
    .map(f => ({ label: `${f.kuerzel} – ${f.beschreibung ?? f.kuerzel}`, value: f.id })),
)

const abschnittOptions = Object.entries(ABSCHNITT_LABELS).map(([v, label]) => ({
  label,
  value: Number(v),
}))

function resetFilter(): void {
  filterText.value = ''
  filterJahrgang.value = null
  filterFach.value = null
  filterAbschnitt.value = null
}

// ── Laden ────────────────────────────────────────────────────────────────────
async function loadData(): Promise<void> {
  loading.value = true
  errorMsg.value = ''
  await Promise.all([loadKompetenzen(), loadJahrgaenge(), loadFaecher()])
  loading.value = false
}

async function loadKompetenzen(): Promise<void> {
  loadingKompetenzen.value = true
  try {
    kompetenzen.value = await fetchAnkreuzkompetenzen()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Ankreuzkompetenzen konnten nicht geladen werden.'
  } finally {
    loadingKompetenzen.value = false
  }
}

async function loadJahrgaenge(): Promise<void> {
  try {
    jahrgaenge.value = await fetchJahrgaenge()
  } catch {
    // Jahrgänge nur für ID-Auflösung
  }
}

async function loadFaecher(): Promise<void> {
  try {
    faecher.value = await fetchFaecher()
  } catch {
    // Fächer nur für ID-Auflösung
  }
}

// ── Löschen ──────────────────────────────────────────────────────────────────
function confirmDelete(): void {
  const n = selectedKompetenzen.value.length
  confirm.require({
    message: `${n} Ankreuzkompetenz${n === 1 ? '' : 'en'} unwiderruflich löschen?`,
    header: 'Ankreuzkompetenzen löschen',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Ja, löschen',
    rejectLabel: 'Abbrechen',
    acceptClass: 'p-button-danger',
    accept: () => handleDelete(),
  })
}

async function handleDelete(): Promise<void> {
  deleting.value = true
  errorMsg.value = ''
  const ids = selectedKompetenzen.value.map(k => k.id)
  const n = ids.length
  const result = await deleteAnkreuzkompetenzen(ids)
  selectedKompetenzen.value = []
  await loadKompetenzen()
  deleting.value = false
  if (!result.success) {
    errorMsg.value = result.error ?? 'Löschen fehlgeschlagen.'
  } else {
    successMsg.value = `${n} Ankreuzkompetenz${n === 1 ? '' : 'en'} erfolgreich gelöscht.`
  }
}

// ── Import ───────────────────────────────────────────────────────────────────
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  importError.value = ''
  importRows.value = []
  try {
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
    importRows.value = isXlsx
      ? await parseAnkreuzkompetenzXlsx(file)
      : await parseAnkreuzkompetenzCsv(file)
    if (importRows.value.length === 0) {
      importError.value = 'Keine Datensätze in der Datei gefunden.'
    }
  } catch (e) {
    importError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei.'
  }
}

function resetImport(): void {
  importRows.value = []
  selectedImportRows.value = []
  importError.value = ''
  importProgress.value = ''
  importCancelled.value = false
  fileUploadRef.value?.clear?.()
}

function stopImport(): void {
  importCancelled.value = true
}

function parseBool(val: string): boolean {
  return val === '1' || val.toLowerCase() === 'true' || val.toLowerCase() === 'ja'
}

async function handleImport(): Promise<void> {
  const rows = selectedImportRows.value.length > 0 ? selectedImportRows.value : importRows.value
  importing.value = true
  importCancelled.value = false
  let sent = 0
  let failed = 0
  const total = rows.length
  importProgress.value = `0 / ${total}`

  for (let i = 0; i < rows.length; i++) {
    if (importCancelled.value) break
    const row = rows[i]

    // idFach auflösen
    let idFach: number | null = null
    if (row.fach && !Number.isNaN(Number(row.fach))) {
      idFach = Number(row.fach)
    } else if (row.fach) {
      const found = faecher.value.find(f => f.kuerzel?.toLowerCase() === row.fach.toLowerCase())
      if (found) idFach = found.id
    }

    // idsJahrgaenge auflösen
    const jahrgangIds: number[] = []
    if (row.jahrgang) {
      for (const part of row.jahrgang.split(',').map((s: string) => s.trim()).filter(Boolean)) {
        if (!Number.isNaN(Number(part))) {
          jahrgangIds.push(Number(part))
        } else {
          const found = jahrgaenge.value.find(
            j =>
              j.kuerzel?.toLowerCase() === part.toLowerCase() ||
              j.kuerzelStatistik?.toLowerCase() === part.toLowerCase(),
          )
          if (found) jahrgangIds.push(found.id)
        }
      }
    }

    const abschnitt = row.abschnitt && !Number.isNaN(Number(row.abschnitt))
      ? Number(row.abschnitt)
      : 3

    const payload = {
      idFach,
      istASV: row.istASV ? parseBool(row.istASV) : false,
      schulgliederung: row.schulgliederung || null,
      floskelText: row.text.trim(),
      abschnitt,
      istAktiv: true,
      istSichtbar: true,
      fachSortierung: 32000,
      sortierung: row.sortierung && !Number.isNaN(Number(row.sortierung))
        ? Number(row.sortierung)
        : 32000,
      jahrgaengezuordnung: [],
    }

    if (!payload.floskelText) {
      failed++
      importProgress.value = `${i + 1} / ${total}`
      continue
    }

    const result = await createAnkreuzkompetenz(payload)
    if (!result.success || result.id == null) {
      failed++
    } else {
      // Jahrgangszuordnungen anlegen
      for (const idJahrgang of jahrgangIds) {
        await addAnkreuzkompetenzJahrgangszuordnung({
          idAnkreuzkompetenz: result.id,
          idJahrgang,
        })
      }
      sent++
    }

    importProgress.value = `${i + 1} / ${total}`
  }

  importing.value = false
  importProgress.value = ''
  await loadKompetenzen()

  if (failed > 0) {
    errorMsg.value = `${sent} importiert, ${failed} fehlgeschlagen (ggf. Pflichtfeld fehlt oder Serverfehler).`
  } else {
    successMsg.value = `${sent} Ankreuzkompetenz${sent === 1 ? '' : 'en'} erfolgreich importiert.`
    resetImport()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.ankreuz-view {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
}

h2 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.panel {
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-card);
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.panel h3 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.panel-hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.72rem;
}

.section-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.section-head h3 {
  margin: 0;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.filter-search {
  width: 130px;
}

.filter-select {
  width: 110px;
}

.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--p-surface-ground);
  border: 1px solid var(--p-primary-color);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--p-text-color);
}

.selection-icon {
  color: var(--p-primary-color);
  font-size: 0.75rem;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem;
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
}

.table-empty-icon {
  font-size: 1.25rem;
  opacity: 0.4;
}

.import-summary {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.import-summary-hint {
  color: var(--p-text-muted-color);
  font-size: 0.72rem;
}

.import-progress {
  color: var(--p-text-muted-color);
  font-size: 0.72rem;
}

.muted {
  color: var(--p-text-muted-color);
}

.status-ok {
  color: var(--p-green-500);
  font-size: 0.75rem;
}

.status-off {
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
}

:deep(.p-datatable thead th),
:deep(.p-datatable tbody td) {
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
}

:deep(.p-datatable .p-checkbox) {
  width: 14px;
  height: 14px;
}

:deep(.p-datatable .p-checkbox .p-checkbox-box) {
  width: 14px;
  height: 14px;
}

:deep(.p-datatable .p-checkbox .p-checkbox-icon) {
  font-size: 0.6rem;
  width: 0.6rem;
  height: 0.6rem;
}

:deep(.p-datatable .p-tag) {
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
}

:deep(.p-paginator) {
  font-size: 0.72rem;
  padding: 0.15rem 0.25rem;
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-last) {
  min-width: 1.5rem;
  height: 1.5rem;
  font-size: 0.72rem;
  padding: 0;
}

:deep(.p-paginator .p-paginator-page .p-icon),
:deep(.p-paginator .p-paginator-nav-button .p-icon) {
  width: 0.7rem;
  height: 0.7rem;
}

:deep(.p-paginator .p-select) {
  font-size: 0.72rem;
}

:deep(.p-paginator .p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.15rem 0.25rem;
}

:deep(.p-paginator .p-select .p-select-dropdown) {
  width: 1.25rem;
}

:deep(.p-fileupload-basic .p-button) {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

:deep(.p-fileupload-label),
:deep(.p-fileupload-basic-content span:not(.p-button-label):not(.p-button-icon)) {
  font-size: 0.72rem !important;
  color: var(--p-text-muted-color);
}

:deep(.filter-bar .p-select),
:deep(.filter-bar .p-inputtext) {
  font-size: 0.72rem;
}

:deep(.filter-bar .p-select .p-select-label),
:deep(.filter-bar .p-select .p-inputtext) {
  font-size: 0.72rem;
  padding: 0.2rem 0.25rem;
}

:deep(.filter-bar .p-select .p-select-dropdown) {
  width: 1.25rem;
}

:deep(.filter-bar .p-select .p-select-dropdown .p-icon) {
  width: 0.6rem;
  height: 0.6rem;
}

:deep(.filter-bar .p-inputtext) {
  padding: 0.2rem 0.35rem;
}
</style>
