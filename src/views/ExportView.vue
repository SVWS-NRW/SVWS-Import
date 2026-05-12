<template>
  <div class="export-view">
    <h2>Daten exportieren</h2>
    <p class="subtitle">Wähle einen Datentyp, stelle die gewünschten Felder zusammen und exportiere als CSV oder JSON.</p>

    <!-- Kacheln -->
    <div class="export-cards">
      <div
        v-for="tile in TILES"
        :key="tile.id"
        class="export-card"
        :class="{
          active:        selectedTile === tile.id,
          'coming-soon': tile.comingSoon,
        }"
        :title="tile.comingSoon ? 'Noch nicht verfügbar' : undefined"
        @click="!tile.comingSoon && selectTile(tile.id)"
      >
        <i :class="[tile.icon, 'card-icon']" />
        <div>
          <strong>{{ tile.label }}</strong>
          <small>{{ tile.description }}</small>
          <span v-if="tile.comingSoon" class="coming-soon-badge">In Vorbereitung</span>
        </div>
      </div>
    </div>

    <!-- Konfigurationsbereich -->
    <template v-if="activeTile">

      <!-- Felder wählen -->
      <div class="config-section">
        <div class="section-header">
          <h3 class="section-title">Felder auswählen</h3>
          <div class="section-actions">
            <Button label="Alle" size="small" severity="secondary" text @click="selectAll" />
            <Button label="Keine" size="small" severity="secondary" text @click="selectNone" />
          </div>
        </div>
        <div class="field-grid">
          <label
            v-for="field in activeTile.fields"
            :key="field.key"
            class="field-label"
          >
            <Checkbox v-model="selectedFields" :value="field.key" />
            <span>{{ field.label }}</span>
          </label>
        </div>
      </div>

      <!-- Format + Aktionen -->
      <div class="config-section">
        <h3 class="section-title">Format</h3>
        <div class="format-row">
          <label class="format-option">
            <RadioButton v-model="format" inputId="fmt-csv" value="csv" />
            <i class="pi pi-file" />
            <span>CSV</span>
          </label>
          <label class="format-option">
            <RadioButton v-model="format" inputId="fmt-json" value="json" />
            <i class="pi pi-code" />
            <span>JSON</span>
          </label>
          <div class="format-actions">
            <Button
              :label="loadBtnLabel"
              :icon="selectedTile === 'schueler' ? 'pi pi-file-export' : 'pi pi-refresh'"
              severity="secondary"
              outlined
              :loading="loading"
              :disabled="selectedFields.length === 0 || (selectedTile === 'schueler' && schuelerAuswahl.length === 0)"
              @click="loadData"
            />
            <Button
              v-if="data.length > 0 && selectedTile !== 'schueler'"
              label="Exportieren"
              icon="pi pi-file-export"
              :disabled="selectedFields.length === 0"
              @click="doExport"
            />
          </div>
        </div>
        <div v-if="exportProgress > 0" class="export-progress">
          <span class="progress-text">Lade {{ exportDone }} / {{ exportTotal }} Schülerdaten…</span>
          <ProgressBar :value="Math.round(exportProgress * 100)" style="height: 6px; flex: 1" />
        </div>
      </div>

      <Message v-if="loadError" severity="error" :closable="true" @close="loadError = ''">
        {{ loadError }}
      </Message>

      <!-- Schülerliste (automatisch bei Schülerdaten-Kachel) -->
      <div v-if="selectedTile === 'schueler'" class="config-section">
        <div class="section-header">
          <h3 class="section-title">
            Schülerliste
            <span v-if="schuelerAuswahl.length > 0" class="count-badge">
              {{ filteredSchueler.length }} von {{ schuelerAuswahl.length }}
              <template v-if="selectedSchueler.length > 0"> · {{ selectedSchueler.length }} ausgewählt</template>
            </span>
          </h3>
          <div class="section-actions">
            <Select
              v-if="schuleStore.loaded"
              v-model="selectedAbschnittId"
              :options="schuleStore.abschnitteOptions"
              optionLabel="label"
              optionValue="id"
              placeholder="Abschnitt wählen"
              style="width: 200px"
            />
            <InputNumber
              v-else
              v-model="selectedAbschnittId"
              :min="1"
              placeholder="Abschnitt-ID"
              style="width: 130px"
            />
            <MultiSelect
              v-model="jahrgangFilter"
              :options="jahrgaengeOptions"
              placeholder="Jahrgang"
              style="width: 140px"
            />
            <MultiSelect
              v-model="klasseFilter"
              :options="klassenOptions"
              placeholder="Klasse"
              style="width: 140px"
            />
            <MultiSelect
              v-model="statusFilter"
              :options="SCHUELER_STATUS_OPTIONS"
              optionLabel="label"
              optionValue="value"
              placeholder="Status"
              style="width: 150px"
            />
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              text
              :loading="listLoading"
              :disabled="selectedAbschnittId === null"
              aria-label="Neu laden"
              @click="reloadAuswahlliste"
            />
          </div>
        </div>
        <div v-if="listLoading" class="list-empty">
          <i class="pi pi-spin pi-spinner" />
          <span>Schüler werden geladen…</span>
        </div>
        <div v-else-if="listError" class="list-error">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ listError }}</span>
        </div>
        <DataTable
          v-else
          v-model:selection="selectedSchueler"
          :value="filteredSchueler"
          dataKey="id"
          scrollable
          scrollHeight="400px"
          :virtualScrollerOptions="{ itemSize: 36 }"
          size="small"
          sortMode="single"
        >
          <Column selectionMode="multiple" style="width: 3rem; flex: none" />
          <Column field="nachname" header="Nachname" sortable style="min-width: 140px" />
          <Column field="vorname" header="Vorname" sortable style="min-width: 120px" />
          <Column field="klasse" header="Klasse" sortable style="min-width: 90px" />
          <Column field="jahrgang" header="Jahrgang" sortable style="min-width: 100px" />
          <Column header="Status" sortField="status" sortable style="min-width: 110px">
            <template #body="{ data: row }">
              <span :class="['status-badge', `status-${row.status}`]">
                {{ statusLabel(row.status) }}
              </span>
            </template>
          </Column>
          <template #empty>
            <span style="color: var(--p-text-muted-color); font-size: 0.875rem;">
              Keine Schüler für den gewählten Status.
            </span>
          </template>
        </DataTable>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import ProgressBar from 'primevue/progressbar'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { fetchForExport, fetchSchuelerAuswahlliste, enrichSchueler, fetchOrteById, type SchuelerAuswahl } from '@/services/svwsService'
import type { OrtKatalogEintrag } from '@/models/ImportSchema'
import { exportAsCsv, exportAsJson } from '@/utils/exportUtils'
import { useSchuleStore } from '@/stores/schule'

interface FieldDef { key: string; label: string }

interface SubEndpoint {
  path: (id: number) => string
  fieldKeys: string[]
}

interface ExportTile {
  id: string
  label: string
  description: string
  icon: string
  comingSoon?: boolean
  endpoint?: string        // Bulk-Endpunkt (z.B. Lehrer)
  subEndpoints?: SubEndpoint[]  // Per-Datensatz-Endpunkte (z.B. Schüler)
  fields?: FieldDef[]
}

const TILES: ExportTile[] = [
  {
    id: 'schueler',
    label: 'Schülerdaten',
    description: 'Schülerinnen und Schüler exportieren',
    icon: 'pi pi-users',
    subEndpoints: [
      {
        path: id => `/schueler/${id}/stammdaten`,
        fieldKeys: [
          'nachname', 'vorname', 'alleVornamen', 'geschlecht', 'geburtsdatum',
          'status', 'anmeldedatum', 'aufnahmedatum', 'beginnBildungsgang',
          'staatsangehoerigkeitID', 'strassenname', 'hausnummer', 'plz', 'ort',
          'telefon', 'emailPrivat', 'emailSchule',
        ],
      },
      // Weitere Endpunkte hier ergänzen, z.B.:
      // { path: id => `/schueler/${id}/schulbesuch`, fieldKeys: ['schulgliederung', ...] },
      // { path: id => `/schueler/${id}/betriebe`,    fieldKeys: ['betrieb', ...] },
    ],
    fields: [
      { key: 'nachname',              label: 'Nachname'           },
      { key: 'vorname',               label: 'Vorname'            },
      { key: 'alleVornamen',          label: 'Alle Vornamen'      },
      { key: 'geschlecht',            label: 'Geschlecht'         },
      { key: 'geburtsdatum',          label: 'Geburtsdatum'       },
      { key: 'status',                label: 'Status'             },
      { key: 'klasse',                label: 'Klasse'             },
      { key: 'jahrgang',              label: 'Jahrgang'           },
      { key: 'anmeldedatum',          label: 'Anmeldedatum'       },
      { key: 'aufnahmedatum',         label: 'Aufnahmedatum'      },
      { key: 'beginnBildungsgang',    label: 'Bildungsgangbeginn' },
      { key: 'staatsangehoerigkeitID',label: 'Staatsangehörigkeit'},
      { key: 'strassenname',          label: 'Straße'             },
      { key: 'hausnummer',            label: 'Hausnummer'         },
      { key: 'plz',                   label: 'PLZ'                },
      { key: 'ort',                   label: 'Wohnort'            },
      { key: 'telefon',               label: 'Telefon'            },
      { key: 'emailPrivat',           label: 'E-Mail (privat)'    },
      { key: 'emailSchule',           label: 'E-Mail (Schule)'    },
    ],
  },
  {
    id: 'lehrer',
    label: 'Lehrerdaten',
    description: 'Lehrkräfte exportieren',
    icon: 'pi pi-id-card',
    endpoint: '/lehrer',
    fields: [
      { key: 'kuerzel',               label: 'Kürzel'            },
      { key: 'nachname',              label: 'Nachname'          },
      { key: 'vorname',               label: 'Vorname'           },
      { key: 'personalTyp',           label: 'Personaltyp'       },
      { key: 'anrede',                label: 'Anrede'            },
      { key: 'titel',                 label: 'Titel'             },
      { key: 'amtsbezeichnung',       label: 'Amtsbezeichnung'   },
      { key: 'geschlecht',            label: 'Geschlecht'        },
      { key: 'geburtsdatum',          label: 'Geburtsdatum'      },
      { key: 'staatsangehoerigkeitID',label: 'Staatsangehörigkeit'},
      { key: 'strassenname',          label: 'Straße'            },
      { key: 'hausnummer',            label: 'Hausnummer'        },
      { key: 'plz',                   label: 'PLZ'               },
      { key: 'ort',                   label: 'Wohnort'           },
      { key: 'telefon',               label: 'Telefon'           },
      { key: 'telefonMobil',          label: 'Telefon (Mobil)'   },
      { key: 'emailPrivat',           label: 'E-Mail (privat)'   },
      { key: 'emailDienstlich',       label: 'E-Mail (dienstlich)'},
    ],
  },
  {
    id: 'erzieher',
    label: 'Erzieherdaten',
    description: 'Erziehungsberechtigte exportieren',
    icon: 'pi pi-heart',
    comingSoon: true,
  },
  {
    id: 'betriebe',
    label: 'Betriebe',
    description: 'Ausbildungsbetriebe exportieren',
    icon: 'pi pi-building',
    comingSoon: true,
  },
  {
    id: 'lernplattformen',
    label: 'Lernplattformen',
    description: 'Zugangsdaten für Lernplattformen exportieren',
    icon: 'pi pi-desktop',
    comingSoon: true,
  },
]

const SCHUELER_STATUS_OPTIONS = [
  { value: 0,  label: 'Aufnahme'   },
  { value: 1,  label: 'Warteliste' },
  { value: 2,  label: 'Aktiv'      },
  { value: 3,  label: 'Beurlaubt'  },
  { value: 6,  label: 'Extern'     },
  { value: 8,  label: 'Abschluss'  },
  { value: 9,  label: 'Abgang'     },
  { value: 10, label: 'Ehemalige'  },
]

const SCHUELER_STATUS_LABELS: Record<number, string> = Object.fromEntries(
  SCHUELER_STATUS_OPTIONS.map(o => [o.value, o.label]),
)

function statusLabel(status: number): string {
  return SCHUELER_STATUS_LABELS[status] ?? `Status ${status}`
}

const schuleStore = useSchuleStore()

const selectedTile        = ref<string | null>(null)
const selectedFields      = ref<string[]>([])
const format              = ref<'csv' | 'json'>('csv')
const data                = ref<Record<string, unknown>[]>([])
const loading             = ref(false)
const loadError           = ref('')
const schuelerAuswahl     = ref<SchuelerAuswahl[]>([])
const selectedSchueler    = ref<SchuelerAuswahl[]>([])
const statusFilter        = ref<number[]>([2])
const jahrgangFilter      = ref<string[]>([])
const klasseFilter        = ref<string[]>([])
const selectedAbschnittId = ref<number | null>(null)
const listLoading         = ref(false)
const listError           = ref('')
const exportProgress      = ref(0)
const exportDone          = ref(0)
const exportTotal         = ref(0)

const activeTile = computed(() => TILES.find(t => t.id === selectedTile.value))

const loadBtnLabel = computed(() => {
  if (selectedTile.value === 'schueler') {
    const count = selectedSchueler.value.length > 0
      ? selectedSchueler.value.length
      : filteredSchueler.value.length
    return count > 0 ? `${count} Schüler exportieren` : 'Exportieren'
  }
  return data.value.length ? `Neu laden (${data.value.length} Datensätze)` : 'Daten laden'
})

const jahrgaengeOptions = computed(() =>
  [...new Set(schuelerAuswahl.value.map(s => s.jahrgang).filter((j): j is string => !!j))].sort(),
)

const klassenOptions = computed(() =>
  [...new Set(schuelerAuswahl.value.map(s => s.klasse).filter((k): k is string => !!k))].sort(),
)

const filteredSchueler = computed(() => {
  const statusSet  = statusFilter.value.length  > 0 ? new Set(statusFilter.value)  : null
  const jahrgSet   = jahrgangFilter.value.length > 0 ? new Set(jahrgangFilter.value) : null
  const klasseSet  = klasseFilter.value.length  > 0 ? new Set(klasseFilter.value)  : null

  if (!statusSet && !jahrgSet && !klasseSet) return schuelerAuswahl.value

  return schuelerAuswahl.value.filter(s =>
    (!statusSet || statusSet.has(s.status)) &&
    (!jahrgSet  || jahrgSet.has(s.jahrgang  as string)) &&
    (!klasseSet || klasseSet.has(s.klasse   as string)),
  )
})

onMounted(() => {
  if (schuleStore.aktuellerAbschnittId !== null) {
    selectedAbschnittId.value = schuleStore.aktuellerAbschnittId
  }
})

watch(selectedAbschnittId, (newId, oldId) => {
  if (newId !== null && oldId !== null && selectedTile.value === 'schueler') {
    reloadAuswahlliste()
  }
})

function selectTile(id: string): void {
  if (selectedTile.value === id) return
  selectedTile.value = id
  data.value = []
  loadError.value = ''
  schuelerAuswahl.value = []
  selectedSchueler.value = []
  jahrgangFilter.value = []
  klasseFilter.value = []
  listError.value = ''
  const tile = TILES.find(t => t.id === id)
  selectedFields.value = tile?.fields?.map(f => f.key) ?? []
  if (id === 'schueler') reloadAuswahlliste()
}

function selectAll(): void {
  selectedFields.value = activeTile.value?.fields?.map(f => f.key) ?? []
}

function selectNone(): void {
  selectedFields.value = []
}

async function reloadAuswahlliste(): Promise<void> {
  if (selectedAbschnittId.value === null) return
  listLoading.value = true
  listError.value = ''
  selectedSchueler.value = []
  try {
    schuelerAuswahl.value = await fetchSchuelerAuswahlliste(selectedAbschnittId.value)
  } catch (e) {
    listError.value = e instanceof Error ? e.message : 'Fehler beim Laden der Schülerliste'
    schuelerAuswahl.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadData(): Promise<void> {
  const tile = activeTile.value
  if (!tile) return
  loadError.value = ''

  if (tile.id === 'schueler') {
    const students = selectedSchueler.value.length > 0
      ? selectedSchueler.value
      : filteredSchueler.value
    if (students.length === 0) {
      loadError.value = 'Keine Schüler zum Exportieren vorhanden.'
      return
    }
    if (selectedFields.value.length === 0) {
      loadError.value = 'Bitte mindestens ein Feld auswählen.'
      return
    }

    // Nur Endpunkte laden deren Felder auch selektiert sind
    const neededEndpoints = (tile.subEndpoints ?? [])
      .filter(ep => ep.fieldKeys.some(k => selectedFields.value.includes(k)))
      .map(ep => ep.path)

    loading.value = true
    exportProgress.value = 0
    exportDone.value = 0
    exportTotal.value = students.length
    try {
      const needsOrt = selectedFields.value.some(f => f === 'plz' || f === 'ort')
      const [enriched, orteById] = await Promise.all([
        enrichSchueler(
          students,
          neededEndpoints,
          (done, total) => { exportDone.value = done; exportTotal.value = total; exportProgress.value = done / total },
        ),
        needsOrt ? fetchOrteById() : Promise.resolve(null as unknown as Map<number, OrtKatalogEintrag>),
      ])

      const resolved = enriched.map(row => {
        const r: Record<string, unknown> = { ...row }

        // PLZ/Ort: SVWS stores wohnortID, resolve to text via catalog
        if (orteById) {
          const entry = orteById.get(r.wohnortID as number)
          r.plz = entry?.plz ?? ''
          r.ort = entry?.ortsname ?? ''
        }

        // Hausnummer: combine with hausnummerZusatz (e.g. "12" + "a" → "12a")
        const zusatz = String(r.hausnummerZusatz ?? '').trim()
        if (zusatz) r.hausnummer = `${String(r.hausnummer ?? '').trim()}${zusatz}`

        return r
      })

      const date = new Date().toISOString().slice(0, 10)
      const filename = `schueler_export_${date}`
      format.value === 'csv'
        ? exportAsCsv(resolved, selectedFields.value, `${filename}.csv`)
        : exportAsJson(resolved, selectedFields.value, `${filename}.json`)
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Fehler beim Exportieren'
    } finally {
      loading.value = false
      exportProgress.value = 0
      exportDone.value = 0
      exportTotal.value = 0
    }
    return
  }

  if (!tile.endpoint) return
  loading.value = true
  try {
    data.value = await fetchForExport(tile.endpoint)
    if (data.value.length === 0) loadError.value = 'Keine Datensätze auf dem Server gefunden.'
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Fehler beim Laden der Daten'
    data.value = []
  } finally {
    loading.value = false
  }
}

function doExport(): void {
  const tile = activeTile.value
  if (!tile || data.value.length === 0 || selectedFields.value.length === 0) return
  const date     = new Date().toISOString().slice(0, 10)
  const filename = `${tile.id}_export_${date}`
  if (format.value === 'csv') {
    exportAsCsv(data.value, selectedFields.value, `${filename}.csv`)
  } else {
    exportAsJson(data.value, selectedFields.value, `${filename}.json`)
  }
}
</script>

<style scoped>
.export-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

h2 { margin: 0; font-size: 1.5rem; }

.subtitle {
  margin: -1.25rem 0 0;
  color: var(--p-text-muted-color);
}

/* ── Kacheln ─────────────────────────────────────────────────────────────── */

.export-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.export-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border: 2px solid var(--p-surface-border);
  border-radius: 10px;
  cursor: pointer;
  background: var(--p-surface-card);
  transition: border-color 0.15s, background 0.15s;
}

.export-card:hover:not(.coming-soon) {
  border-color: var(--p-primary-400);
}

.export-card.active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

:global(.dark) .export-card.active {
  background: color-mix(in srgb, var(--p-primary-color) 15%, var(--p-surface-card));
}

.export-card.coming-soon {
  opacity: 0.55;
  cursor: not-allowed;
  border-style: dashed;
}

.card-icon {
  font-size: 2rem;
  color: var(--p-primary-color);
  flex-shrink: 0;
}

.export-card.active .card-icon { color: var(--p-primary-700); }

.export-card strong { display: block; font-size: 1rem; }
.export-card small  { color: var(--p-text-muted-color); font-size: 0.82rem; }

.coming-soon-badge {
  display: inline-block;
  margin-top: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  background: var(--p-surface-200, #e5e7eb);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
}

:global(.dark) .coming-soon-badge {
  background: var(--p-surface-700, #374151);
}

/* ── Konfig-Sektionen ────────────────────────────────────────────────────── */

.config-section {
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Checkbox-Raster */
.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.6rem 1.5rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.875rem;
  cursor: pointer;
  user-select: none;
}

/* Format-Auswahl */
.format-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.format-option i { color: var(--p-primary-color); }

.format-actions {
  margin-left: auto;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}


/* Export-Fortschritt */
.export-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.82rem;
  color: var(--p-text-muted-color);
}

.progress-text { white-space: nowrap; }

/* Schülerliste */
.list-empty,
.list-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

.list-empty { color: var(--p-text-muted-color); }
.list-error { color: var(--p-red-500, #ef4444); }

.count-badge {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
  margin-left: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-0  { background: #e0f2fe; color: #075985; }
.status-1  { background: #fef9c3; color: #854d0e; }
.status-2  { background: #dcfce7; color: #166534; }
.status-3  { background: #fef3c7; color: #92400e; }
.status-6  { background: #f3e8ff; color: #6b21a8; }
.status-8  { background: #f0fdf4; color: #166534; }
.status-9  { background: #fef2f2; color: #991b1b; }
.status-10 { background: #f1f5f9; color: #475569; }

:global(.dark) .status-0  { background: #0c4a6e; color: #7dd3fc; }
:global(.dark) .status-1  { background: #713f12; color: #fde68a; }
:global(.dark) .status-2  { background: #14532d; color: #86efac; }
:global(.dark) .status-3  { background: #78350f; color: #fcd34d; }
:global(.dark) .status-6  { background: #4c1d95; color: #d8b4fe; }
:global(.dark) .status-8  { background: #14532d; color: #86efac; }
:global(.dark) .status-9  { background: #7f1d1d; color: #fca5a5; }
:global(.dark) .status-10 { background: #1e293b; color: #94a3b8; }
</style>
