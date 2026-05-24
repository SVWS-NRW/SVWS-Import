<template>
  <div class="floskel-view">
    <div class="view-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="router.push({ name: 'import' })"
          aria-label="Zurück"
        />
        <h2>Floskeln verwalten</h2>
      </div>
      <Button
        label="Neu laden"
        icon="pi pi-refresh"
        severity="secondary"
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

    <!-- Floskelgruppen -->
    <section class="panel">
      <h3>
        Floskelgruppen
        <Tag v-if="floskelgruppen.length" :value="String(floskelgruppen.length)" severity="secondary" />
      </h3>
      <DataTable
        :value="floskelgruppen"
        :loading="loadingGruppen"
        dataKey="id"
        size="small"
        stripedRows
        scrollable
        scrollHeight="240px"
        class="gruppen-table"
        :rowClass="(d: Floskelgruppe) => filterGruppe === d.id ? 'row-active' : ''"
        @row-click="(e) => toggleGruppeFilter(e.data.id)"
      >
        <Column field="kuerzel" header="Kürzel" style="width: 100px" sortable />
        <Column field="bezeichnung" header="Bezeichnung" sortable />
        <Column header="Art" style="width: 130px" sortable :sortField="(d: Floskelgruppe) => FLOSKELGRUPPENARTEN.get(d.idFloskelgruppenart ?? -1)?.kuerzel ?? ''">
          <template #body="{ data }">
            <span
              v-if="data.idFloskelgruppenart != null && FLOSKELGRUPPENARTEN.has(data.idFloskelgruppenart)"
              :title="FLOSKELGRUPPENARTEN.get(data.idFloskelgruppenart)?.text"
            >
              {{ FLOSKELGRUPPENARTEN.get(data.idFloskelgruppenart)?.kuerzel }}
            </span>
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <Column header="Floskeln" style="width: 90px" :sortField="(d: Floskelgruppe) => String(floskelCountByGruppe[d.id] ?? 0)" sortable>
          <template #body="{ data }">
            <Tag :value="String(floskelCountByGruppe[data.id] ?? 0)" severity="secondary" />
          </template>
        </Column>
        <Column field="referenziertInAnderenTabellen" header="Verwendet" style="width: 100px">
          <template #body="{ data }">
            <Tag v-if="data.referenziertInAnderenTabellen" value="Ja" severity="warn" />
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <template #empty>
          <div class="table-empty">
            <i class="pi pi-inbox table-empty-icon" />
            <span>Keine Floskelgruppen vorhanden.</span>
          </div>
        </template>
      </DataTable>
      <p v-if="filterGruppe !== null" class="filter-hint">
        <i class="pi pi-filter" />
        Gruppenfilter aktiv – Klick auf die Zeile zum Aufheben
      </p>
    </section>

    <!-- Bestehende Floskeln -->
    <section class="panel">
      <div class="section-head">
        <h3>
          Bestehende Floskeln
          <Tag v-if="!loadingFloskeln" :value="String(filteredFloskeln.length)" severity="secondary" />
        </h3>
        <div class="filter-bar">
          <InputText v-model="filterText" placeholder="Text suchen…" class="filter-search" />
          <Select
            v-model="filterJahrgang"
            :options="jahrgangOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Jahrgang"
            showClear
            class="filter-select"
          />
          <Select
            v-model="filterGruppe"
            :options="gruppeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Gruppe"
            showClear
            class="filter-select"
          />
          <Select
            v-model="filterFach"
            :options="fachOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Fach"
            showClear
            class="filter-select"
          />
          <Select
            v-model="filterNiveau"
            :options="niveauOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Niveau"
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

      <div v-if="selectedFloskeln.length > 0" class="selection-bar">
        <i class="pi pi-check-circle selection-icon" />
        <span>{{ selectedFloskeln.length }} Floskel{{ selectedFloskeln.length === 1 ? '' : 'n' }} ausgewählt</span>
        <Button
          :label="`${selectedFloskeln.length} löschen`"
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
          @click="selectedFloskeln = []"
        />
      </div>

      <DataTable
        v-model:selection="selectedFloskeln"
        :value="filteredFloskeln"
        :loading="loadingFloskeln"
        dataKey="id"
        :paginator="filteredFloskeln.length > 25"
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        stripedRows
        size="small"
        scrollable
        scrollHeight="400px"
        class="floskeln-table"
      >
        <Column selectionMode="multiple" style="width: 2.5rem; flex: 0 0 2.5rem" frozen />
        <Column field="kuerzel" header="Kürzel" style="width: 110px" sortable />
        <Column header="Gruppe" style="width: 95px" sortable :sortField="(d: Floskel) => gruppenById.get(d.idFloskelgruppe)?.kuerzel ?? ''">
          <template #body="{ data }">
            <span :title="gruppenById.get(data.idFloskelgruppe)?.bezeichnung">
              {{ gruppenById.get(data.idFloskelgruppe)?.kuerzel ?? data.idFloskelgruppe }}
            </span>
          </template>
        </Column>
        <Column header="Fach" style="width: 70px" sortable :sortField="(d: Floskel) => faecherById.get(d.idFach ?? -1)?.kuerzel ?? ''">
          <template #body="{ data }">
            <span v-if="data.idFach">{{ faecherById.get(data.idFach)?.kuerzel ?? data.idFach }}</span>
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <Column header="Jg." style="width: 80px">
          <template #body="{ data }">
            <span v-if="data.idsJahrgaenge?.length">
              {{ data.idsJahrgaenge.map((id: number) => jahrgaengeById.get(id)?.kuerzel ?? id).join(', ') }}
            </span>
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <Column field="niveau" header="Niveau" style="width: 80px" sortable>
          <template #body="{ data }">
            <Tag v-if="data.niveau != null" :value="String(data.niveau)" :severity="niveauSeverity(data.niveau)" />
            <span v-else class="muted">–</span>
          </template>
        </Column>
        <Column field="text" header="Text" />
        <template #empty>
          <div class="table-empty">
            <i class="pi pi-inbox table-empty-icon" />
            <span>{{
              loadingFloskeln
                ? 'Lade Floskeln…'
                : hasActiveFilter
                  ? 'Keine Treffer – Filter anpassen.'
                  : 'Keine Floskeln vorhanden.'
            }}</span>
          </div>
        </template>
      </DataTable>
    </section>

    <!-- Floskeln importieren -->
    <section class="panel">
      <h3>Floskeln importieren</h3>
      <p class="panel-hint">CSV- oder Excel-Datei mit Spalten: Kürzel, Text, Gruppe, Jahrgang, Niveau</p>

      <div class="upload-row">
        <FileUpload
          ref="fileUploadRef"
          mode="basic"
          :auto="false"
          :multiple="false"
          accept=".csv,.xlsx,.xls"
          chooseLabel="Datei auswählen"
          :maxFileSize="10000000"
          @select="onFileSelect"
        />
        <span v-if="importFile" class="filename">{{ importFile.name }}</span>
        <Button
          v-if="importFile"
          icon="pi pi-times"
          text
          rounded
          severity="secondary"
          aria-label="Zurücksetzen"
          @click="resetImport"
        />
      </div>

      <Message v-if="importError" severity="error" :closable="true" @close="importError = ''">
        {{ importError }}
      </Message>

      <template v-if="importRows.length > 0">
        <div class="import-summary">
          <Tag :value="`${importRows.length} Zeilen`" severity="info" />
          <span class="import-summary-hint">erkannt – bereit zum Importieren</span>
        </div>

        <DataTable
          :value="importRows"
          size="small"
          stripedRows
          :paginator="importRows.length > 10"
          :rows="10"
          class="import-table"
        >
          <Column field="kuerzel" header="Kürzel" style="width: 110px" />
          <Column field="floskelgruppe" header="Gruppe" style="width: 95px" />
          <Column field="fach" header="Fach" style="width: 65px" />
          <Column field="jahrgang" header="Jg." style="width: 65px" />
          <Column field="niveau" header="Niveau" style="width: 80px" />
          <Column field="text" header="Text" />
        </DataTable>

        <div class="import-actions">
          <Button
            label="Importieren"
            icon="pi pi-file-import"
            :loading="importing"
            @click="handleImport"
          />
          <span v-if="importing" class="import-progress">{{ importProgress }}</span>
          <Button
            label="Abbrechen"
            icon="pi pi-times"
            severity="secondary"
            text
            @click="resetImport"
          />
        </div>
      </template>
    </section>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  fetchFloskelgruppen,
  fetchFloskeln,
  fetchJahrgaenge,
  fetchFaecher,
  deleteFloskeln,
  createFloskel,
  type Floskelgruppe,
  type Floskel,
} from '@/services/svwsService'
import { parseFloskelCsv } from '@/utils/csvParser'
import { parseFloskelXlsx } from '@/utils/xlsxParser'
import type { FloskelImportRow, FloskelApiPayload } from '@/models/Floskel'
import { FLOSKELGRUPPENARTEN } from '@/models/Floskel'
import type { JahrgangDetails } from '@/models/Jahrgaenge'
import type { FachDetails } from '@/models/Faecher'

const router = useRouter()
const confirm = useConfirm()

const loading = ref(false)
const loadingGruppen = ref(false)
const loadingFloskeln = ref(false)
const deleting = ref(false)
const importing = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const importError = ref('')

const floskelgruppen = ref<Floskelgruppe[]>([])
const floskeln = ref<Floskel[]>([])
const jahrgaenge = ref<JahrgangDetails[]>([])
const faecher = ref<FachDetails[]>([])
const selectedFloskeln = ref<Floskel[]>([])

const filterText = ref('')
const filterJahrgang = ref<number | null>(null)
const filterGruppe = ref<number | null>(null)
const filterFach = ref<number | null>(null)
const filterNiveau = ref<number | null>(null)

const fileUploadRef = ref()
const importFile = ref<File | null>(null)
const importRows = ref<FloskelImportRow[]>([])
const importProgress = ref('')

const gruppenById = computed(() => new Map(floskelgruppen.value.map(g => [g.id, g])))
const faecherById = computed(() => new Map(faecher.value.map(f => [f.id, f])))
const jahrgaengeById = computed(() => new Map(jahrgaenge.value.map(j => [j.id, j])))

const floskelCountByGruppe = computed(() => {
  const counts: Record<number, number> = {}
  for (const f of floskeln.value) {
    counts[f.idFloskelgruppe] = (counts[f.idFloskelgruppe] ?? 0) + 1
  }
  return counts
})

// ── Filter ───────────────────────────────────────────────────────────────────
const filteredFloskeln = computed(() => {
  let result = floskeln.value
  if (filterText.value) {
    const q = filterText.value.toLowerCase()
    result = result.filter(f =>
      f.text?.toLowerCase().includes(q) || f.kuerzel?.toLowerCase().includes(q),
    )
  }
  if (filterJahrgang.value !== null) {
    result = result.filter(f => f.idsJahrgaenge?.includes(filterJahrgang.value!))
  }
  if (filterGruppe.value !== null) {
    result = result.filter(f => f.idFloskelgruppe === filterGruppe.value)
  }
  if (filterFach.value !== null) {
    result = result.filter(f => f.idFach === filterFach.value)
  }
  if (filterNiveau.value !== null) {
    result = result.filter(f => f.niveau === filterNiveau.value)
  }
  return result
})

const hasActiveFilter = computed(
  () => !!(filterText.value || filterJahrgang.value !== null || filterGruppe.value !== null || filterFach.value !== null || filterNiveau.value !== null),
)

const jahrgangOptions = computed(() =>
  jahrgaenge.value.map(j => ({ label: j.kuerzel ?? String(j.id), value: j.id })),
)

const fachOptions = computed(() =>
  faecher.value
    .filter(f => floskeln.value.some(fl => fl.idFach === f.id))
    .sort((a, b) => (a.kuerzel ?? '').localeCompare(b.kuerzel ?? ''))
    .map(f => ({ label: `${f.kuerzel} – ${f.beschreibung ?? f.kuerzel}`, value: f.id })),
)

const gruppeOptions = computed(() =>
  floskelgruppen.value
    .filter(g => floskelCountByGruppe.value[g.id] > 0)
    .map(g => ({ label: `${g.kuerzel} – ${g.bezeichnung}`, value: g.id })),
)

const niveauOptions = computed(() => {
  const values = [...new Set(floskeln.value.map(f => f.niveau).filter(v => v != null))].sort(
    (a, b) => (a as number) - (b as number),
  )
  return values.map(v => ({ label: String(v), value: v as number }))
})

function toggleGruppeFilter(id: number): void {
  filterGruppe.value = filterGruppe.value === id ? null : id
}

function resetFilter(): void {
  filterText.value = ''
  filterJahrgang.value = null
  filterGruppe.value = null
  filterFach.value = null
  filterNiveau.value = null
}

function niveauSeverity(niveau: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  const map: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    1: 'info', 2: 'success', 3: 'warn', 4: 'danger',
  }
  return map[niveau] ?? 'secondary'
}

// ── Laden ────────────────────────────────────────────────────────────────────
async function loadData(): Promise<void> {
  loading.value = true
  errorMsg.value = ''
  await Promise.all([loadGruppen(), loadFloskeln(), loadJahrgaenge(), loadFaecher()])
  loading.value = false
}

async function loadGruppen(): Promise<void> {
  loadingGruppen.value = true
  try {
    floskelgruppen.value = await fetchFloskelgruppen()
  } catch {
    // Graceful degradation – Floskelgruppen sind optional für die Anzeige
  } finally {
    loadingGruppen.value = false
  }
}

async function loadFloskeln(): Promise<void> {
  loadingFloskeln.value = true
  try {
    floskeln.value = await fetchFloskeln()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Floskeln konnten nicht geladen werden.'
  } finally {
    loadingFloskeln.value = false
  }
}

async function loadJahrgaenge(): Promise<void> {
  try {
    jahrgaenge.value = await fetchJahrgaenge()
  } catch {
    // Jahrgänge sind nur für die ID-Auflösung beim Import nötig
  }
}

async function loadFaecher(): Promise<void> {
  try {
    faecher.value = await fetchFaecher()
  } catch {
    // Fächer sind nur für die ID-Auflösung beim Import nötig
  }
}

// ── Löschen ──────────────────────────────────────────────────────────────────
function confirmDelete(): void {
  const n = selectedFloskeln.value.length
  confirm.require({
    message: `${n} Floskel${n === 1 ? '' : 'n'} unwiderruflich löschen?`,
    header: 'Floskeln löschen',
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
  const ids = selectedFloskeln.value.map(f => f.id)
  const n = ids.length
  const result = await deleteFloskeln(ids)
  selectedFloskeln.value = []
  await loadFloskeln()
  deleting.value = false
  if (!result.success) {
    errorMsg.value = result.error ?? 'Löschen fehlgeschlagen.'
  } else {
    successMsg.value = `${n} Floskel${n === 1 ? '' : 'n'} erfolgreich gelöscht.`
  }
}

// ── Import ───────────────────────────────────────────────────────────────────
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return
  importFile.value = file
  importError.value = ''
  importRows.value = []
  try {
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
    importRows.value = isXlsx ? await parseFloskelXlsx(file) : await parseFloskelCsv(file)
    if (importRows.value.length === 0) {
      importError.value = 'Keine Datensätze in der Datei gefunden.'
    }
  } catch (e) {
    importError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei.'
  }
}

function resetImport(): void {
  importFile.value = null
  importRows.value = []
  importError.value = ''
  importProgress.value = ''
  fileUploadRef.value?.clear?.()
}

/**
 * Löst Kürzel-Referenzen zu numerischen IDs auf und baut das API-Payload.
 * Gibt null zurück wenn die Floskelgruppe nicht aufgelöst werden kann.
 */
function buildApiPayload(row: FloskelImportRow): FloskelApiPayload | null {
  // idFloskelgruppe: direkte ID aus CSV hat Vorrang, sonst Kürzel-Lookup
  let idFloskelgruppe: number | null = null
  if (row.idFloskelgruppe && !Number.isNaN(Number(row.idFloskelgruppe))) {
    idFloskelgruppe = Number(row.idFloskelgruppe)
  } else if (row.floskelgruppe) {
    const found = floskelgruppen.value.find(
      g => g.kuerzel.toLowerCase() === row.floskelgruppe.toLowerCase(),
    )
    if (found) idFloskelgruppe = found.id
  }
  if (idFloskelgruppe === null) return null

  // idsJahrgaenge: kommagetrennte Kürzel oder IDs
  const idsJahrgaenge: number[] = []
  if (row.jahrgang) {
    for (const part of row.jahrgang.split(',').map(s => s.trim()).filter(Boolean)) {
      if (!Number.isNaN(Number(part))) {
        idsJahrgaenge.push(Number(part))
      } else {
        const found = jahrgaenge.value.find(
          j =>
            j.kuerzel?.toLowerCase() === part.toLowerCase() ||
            j.kuerzelStatistik?.toLowerCase() === part.toLowerCase(),
        )
        if (found) idsJahrgaenge.push(found.id)
      }
    }
  }

  // idFach: direkte ID hat Vorrang, sonst Kürzel-Lookup in Fächer
  let idFach: number | null = null
  if (row.idFach && !Number.isNaN(Number(row.idFach))) {
    idFach = Number(row.idFach)
  } else if (row.fach) {
    const found = faecher.value.find(
      f => f.kuerzel?.toLowerCase() === (row.fach as string).toLowerCase(),
    )
    if (found) idFach = found.id
  }

  return {
    kuerzel: row.kuerzel.trim(),
    text: row.text.trim(),
    idFloskelgruppe,
    idFach,
    niveau: row.niveau && !Number.isNaN(Number(row.niveau)) ? Number(row.niveau) : null,
    sortierung: row.sortierung && !Number.isNaN(Number(row.sortierung))
      ? Number(row.sortierung)
      : 32000,
    idsJahrgaenge,
  }
}

async function handleImport(): Promise<void> {
  importing.value = true
  let sent = 0
  let failed = 0
  for (let i = 0; i < importRows.value.length; i++) {
    importProgress.value = `${i + 1} / ${importRows.value.length}`
    const payload = buildApiPayload(importRows.value[i])
    if (!payload) {
      failed++
      continue
    }
    const result = await createFloskel(payload)
    if (result.success) sent++
    else failed++
  }
  importing.value = false
  importProgress.value = ''
  await loadFloskeln()
  if (failed > 0) {
    errorMsg.value = `${sent} importiert, ${failed} fehlgeschlagen (ggf. Floskelgruppe nicht gefunden oder Serverfehler).`
  } else {
    successMsg.value = `${sent} Floskel${sent === 1 ? '' : 'n'} erfolgreich importiert.`
    resetImport()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.floskel-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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

.panel {
  border: 1px solid var(--p-surface-border);
  border-radius: 12px;
  background: var(--p-surface-card);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.panel h3 {
  margin: 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-hint {
  margin: -0.4rem 0 0;
  color: var(--p-text-muted-color);
  font-size: 0.88rem;
}

.section-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.section-head h3 {
  margin: 0;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.filter-search {
  width: 180px;
}

.filter-select {
  width: 140px;
}

/* Floskelgruppen */
.gruppen-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.gruppe-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border: 1.5px solid var(--p-surface-border);
  border-radius: 20px;
  background: var(--p-surface-card);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  font-size: 0.88rem;
  user-select: none;
  font-family: inherit;
  color: inherit;
}

.gruppe-chip:hover {
  border-color: var(--p-primary-400);
}

.gruppe-chip.active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
  color: var(--p-primary-700);
}

:global(.dark) .gruppe-chip.active {
  background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-card));
  color: var(--p-primary-300);
}

.chip-kuerzel {
  font-weight: 700;
}

.chip-bez {
  color: var(--p-text-muted-color);
}

.gruppe-chip.active .chip-bez {
  color: inherit;
  opacity: 0.8;
}

.chip-count {
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 10px;
  padding: 0.05rem 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
}

:global(.dark) .chip-count {
  background: var(--p-surface-700, #374151);
}

/* Selection bar */
.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--p-primary-50);
  border: 1px solid var(--p-primary-200);
  border-radius: 8px;
  font-size: 0.9rem;
}

:global(.dark) .selection-bar {
  background: color-mix(in srgb, var(--p-primary-color) 12%, var(--p-surface-card));
  border-color: color-mix(in srgb, var(--p-primary-color) 40%, transparent);
}

.selection-icon {
  color: var(--p-primary-color);
}

/* Table empty state */
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--p-text-muted-color);
}

.table-empty-icon {
  font-size: 2rem;
  opacity: 0.4;
}

.state-hint {
  padding: 0.25rem 0;
  font-size: 0.9rem;
}

.state-hint.muted {
  color: var(--p-text-muted-color);
}

/* Upload */
.upload-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filename {
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
}

.import-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.import-summary-hint {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.import-progress {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.muted {
  color: var(--p-text-muted-color);
}
</style>
