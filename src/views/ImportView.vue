<template>
  <div class="import-view">
    <h2>Daten importieren</h2>
    <p class="subtitle">Wähle den Datentyp und lade eine CSV- oder Excel-Datei hoch.</p>

    <div class="import-cards">
      <div class="import-card" :class="{ active: dataType === 'schueler' }" @click="dataType = 'schueler'">
        <i class="pi pi-users card-icon" />
        <div>
          <strong>Schülerdaten</strong>
          <small>Schülerinnen und Schüler anlegen</small>
        </div>
      </div>
      <div class="import-card" :class="{ active: dataType === 'lehrer' }" @click="dataType = 'lehrer'">
        <i class="pi pi-id-card card-icon" />
        <div>
          <strong>Lehrerdaten</strong>
          <small>Lehrkräfte anlegen</small>
        </div>
      </div>
      <div class="import-card wizard-card" @click="router.push({ name: 'wizard' })">
        <i class="pi pi-list-check card-icon" />
        <div>
          <strong>Import-Assistent</strong>
          <small>Geführter Import Schritt für Schritt</small>
        </div>
      </div>
    </div>

    <div class="import-cards coming-soon-cards">
      <div
        v-for="mod in comingSoonModules"
        :key="mod.id"
        class="import-card coming-soon"
        title="Noch nicht verfügbar"
      >
        <i :class="[mod.icon, 'card-icon']" />
        <div>
          <strong>{{ mod.label }}</strong>
          <small>{{ mod.description }}</small>
          <span class="coming-soon-badge">In Vorbereitung</span>
        </div>
      </div>
    </div>

    <div class="upload-area">
      <FileUpload
        ref="fileUploadRef"
        mode="basic"
        :auto="false"
        :multiple="false"
        accept=".csv,.xlsx,.xls,.dat"
        chooseLabel="Datei auswählen"
        :maxFileSize="10000000"
        @select="onFileSelect"
      />
      <span v-if="selectedFile" class="filename">{{ selectedFile.name }}</span>
    </div>

    <Message v-if="parseError" severity="error" :closable="true" @close="parseError = ''">
      {{ parseError }}
    </Message>

    <div v-if="selectedFile" class="action-row">
      <Button
        label="Importieren"
        icon="pi pi-file-import"
        :loading="parsing"
        @click="handleImport"
      />
      <Button
        label="Zurücksetzen"
        icon="pi pi-times"
        severity="secondary"
        text
        @click="reset"
      />
    </div>

    <div class="hints">
      <Fieldset legend="Hinweise zum Dateiformat" :toggleable="true" collapsed>
        <div class="hint-content">
          <div>
            <strong>Schüler-Spalten (CSV/XLSX):</strong>
            <code>Nachname, Vorname, Geschlecht, Geburtsdatum, Klasse, Jahrgang, Anmeldedatum, Aufnahmedatum</code>
          </div>
          <div>
            <strong>Lehrer-Spalten (CSV/XLSX):</strong>
            <code>Kuerzel, Nachname, Vorname, PersonalTyp, Anrede, Titel, Geschlecht, Geburtsdatum, EmailDienstlich, Telefon</code>
          </div>
          <div>
            <strong>Geschlecht:</strong>
            <code>m / w / d / x</code> oder <code>männlich / weiblich / divers</code>
          </div>
          <div>
            <strong>Datum:</strong>
            <code>YYYY-MM-DD</code> oder <code>DD.MM.YYYY</code>
          </div>
        </div>
      </Fieldset>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { importModules } from '@/schemas'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Fieldset from 'primevue/fieldset'
import { useSchuelerStore } from '@/stores/schueler'
import { useLehrerStore } from '@/stores/lehrer'
import { parseSchuelerCsv, parseLehrerCsv } from '@/utils/csvParser'
import { parseSchuelerXlsx, parseLehrerXlsx } from '@/utils/xlsxParser'

const router = useRouter()
const schuelerStore = useSchuelerStore()
const lehrerStore = useLehrerStore()

const comingSoonModules = importModules.filter(m => m.comingSoon)

const dataType = ref<'schueler' | 'lehrer'>('schueler')
const selectedFile = ref<File | null>(null)
const parsing = ref(false)
const parseError = ref('')

function onFileSelect(event: { files: File[] }): void {
  selectedFile.value = event.files[0] ?? null
  parseError.value = ''
}

function reset(): void {
  selectedFile.value = null
  parseError.value = ''
}

async function handleImport(): Promise<void> {
  if (!selectedFile.value) return
  parsing.value = true
  parseError.value = ''
  try {
    const file = selectedFile.value
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)

    if (dataType.value === 'schueler') {
      const rows = isXlsx
        ? await parseSchuelerXlsx(file)
        : await parseSchuelerCsv(file)
      if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
      schuelerStore.setRows(rows)
      schuelerStore.validateAll()
      router.push({ name: 'schueler' })
    } else {
      const rows = isXlsx
        ? await parseLehrerXlsx(file)
        : await parseLehrerCsv(file)
      if (rows.length === 0) throw new Error('Keine Datensätze gefunden')
      lehrerStore.setRows(rows)
      lehrerStore.validateAll()
      router.push({ name: 'lehrer' })
    }
  } catch (e) {
    parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
  } finally {
    parsing.value = false
  }
}
</script>

<style scoped>
.import-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h2 {
  margin: 0;
  font-size: 1.5rem;
}

.subtitle {
  margin: -1rem 0 0;
  color: var(--p-text-muted-color);
}

.import-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.wizard-card {
  border-style: dashed;
}

.coming-soon-cards {
  margin-top: -0.25rem;
}

.import-card.coming-soon {
  opacity: 0.55;
  cursor: not-allowed;
  border-style: dashed;
}

.import-card.coming-soon:hover {
  border-color: var(--p-surface-border);
}

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

.import-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 2px solid var(--p-surface-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: var(--p-surface-card);
}

.import-card:hover {
  border-color: var(--p-primary-400);
}

.import-card.active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

:global(.dark) .import-card.active {
  background: color-mix(in srgb, var(--p-primary-color) 18%, var(--p-surface-card));
}

.card-icon {
  font-size: 2rem;
  color: var(--p-primary-color);
}

.import-card.active .card-icon {
  color: var(--p-primary-700);
}

.import-card.active strong {
  color: var(--p-primary-900);
}

.import-card.active small {
  color: var(--p-primary-700);
}

.import-card strong {
  display: block;
  font-size: 1rem;
}

.import-card small {
  color: var(--p-text-muted-color);
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filename {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.action-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.hint-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.875rem;
}

.hint-content code {
  display: block;
  margin-top: 0.25rem;
  padding: 0.35rem 0.6rem;
  background: var(--p-surface-ground);
  border-radius: 4px;
  font-family: monospace;
  color: var(--p-primary-color);
}
</style>
