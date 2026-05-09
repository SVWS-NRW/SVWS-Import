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

      <!-- Format -->
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
        </div>
      </div>

      <!-- Aktionen -->
      <div class="action-row">
        <Button
          :label="data.length ? `Neu laden (${data.length} Datensätze)` : 'Daten laden'"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="loading"
          @click="loadData"
        />
        <Button
          v-if="data.length > 0"
          label="Exportieren"
          icon="pi pi-file-export"
          :disabled="selectedFields.length === 0"
          @click="doExport"
        />
      </div>

      <Message v-if="loadError" severity="error" :closable="true" @close="loadError = ''">
        {{ loadError }}
      </Message>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import Message from 'primevue/message'
import { fetchForExport } from '@/services/svwsService'
import { exportAsCsv, exportAsJson } from '@/utils/exportUtils'

interface FieldDef { key: string; label: string }

interface ExportTile {
  id: string
  label: string
  description: string
  icon: string
  comingSoon?: boolean
  endpoint?: string
  fields?: FieldDef[]
}

const TILES: ExportTile[] = [
  {
    id: 'schueler',
    label: 'Schülerdaten',
    description: 'Schülerinnen und Schüler exportieren',
    icon: 'pi pi-users',
    endpoint: '/schueler',
    fields: [
      { key: 'nachname',              label: 'Nachname'          },
      { key: 'vorname',               label: 'Vorname'           },
      { key: 'alleVornamen',          label: 'Alle Vornamen'     },
      { key: 'geschlecht',            label: 'Geschlecht'        },
      { key: 'geburtsdatum',          label: 'Geburtsdatum'      },
      { key: 'status',                label: 'Status'            },
      { key: 'anmeldedatum',          label: 'Anmeldedatum'      },
      { key: 'aufnahmedatum',         label: 'Aufnahmedatum'     },
      { key: 'beginnBildungsgang',    label: 'Bildungsgangbeginn'},
      { key: 'staatsangehoerigkeitID',label: 'Staatsangehörigkeit'},
      { key: 'klasse',                label: 'Klasse'            },
      { key: 'jahrgang',              label: 'Jahrgang'          },
      { key: 'strassenname',          label: 'Straße'            },
      { key: 'hausnummer',            label: 'Hausnummer'        },
      { key: 'plz',                   label: 'PLZ'               },
      { key: 'ort',                   label: 'Wohnort'           },
      { key: 'telefon',               label: 'Telefon'           },
      { key: 'email',                 label: 'E-Mail'            },
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

const selectedTile   = ref<string | null>(null)
const selectedFields = ref<string[]>([])
const format         = ref<'csv' | 'json'>('csv')
const data           = ref<Record<string, unknown>[]>([])
const loading        = ref(false)
const loadError      = ref('')

const activeTile = computed(() => TILES.find(t => t.id === selectedTile.value))

function selectTile(id: string): void {
  if (selectedTile.value === id) return
  selectedTile.value = id
  data.value = []
  loadError.value = ''
  const tile = TILES.find(t => t.id === id)
  selectedFields.value = tile?.fields?.map(f => f.key) ?? []
}

function selectAll(): void {
  selectedFields.value = activeTile.value?.fields?.map(f => f.key) ?? []
}

function selectNone(): void {
  selectedFields.value = []
}

async function loadData(): Promise<void> {
  const tile = activeTile.value
  if (!tile?.endpoint) return
  loading.value = true
  loadError.value = ''
  try {
    data.value = await fetchForExport(tile.endpoint)
    if (data.value.length === 0) {
      loadError.value = 'Keine Datensätze auf dem Server gefunden.'
    }
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
  gap: 0.25rem;
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
  gap: 2rem;
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

/* Aktionen */
.action-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
</style>
