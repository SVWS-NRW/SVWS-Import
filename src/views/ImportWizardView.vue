<template>
  <div class="wizard-view">

    <!-- Schritt-Leiste -->
    <div class="wizard-steps">
      <template v-for="(step, idx) in STEPS" :key="step.key">
        <div
          class="wizard-step"
          :class="{
            'is-active':    wizardStore.currentStep === step.key,
            'is-done':      wizardStore.completedSteps.has(step.key),
            'is-clickable': idx <= wizardStore.currentStepIndex,
          }"
          @click="wizardStore.goToStep(step.key)"
        >
          <div class="step-dot">
            <i v-if="wizardStore.completedSteps.has(step.key)" class="pi pi-check" />
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
        </div>
        <div
          v-if="idx < STEPS.length - 1"
          class="step-connector"
          :class="{ 'is-done': wizardStore.completedSteps.has(step.key) }"
        />
      </template>
    </div>

    <!-- Schritt-Inhalt -->
    <div class="wizard-content">

      <!-- Schritt 1: Modul & Datei wählen -->
      <template v-if="wizardStore.currentStep === 'upload'">
        <h3 class="content-title">Importmodul &amp; Datei wählen</h3>

        <div class="module-grid">
          <div
            v-for="mod in importModules"
            :key="mod.id"
            class="module-card"
            :class="{ active: wizardStore.selectedModule?.id === mod.id }"
            @click="wizardStore.setModule(mod)"
          >
            <i :class="[mod.icon, 'module-icon']" />
            <div>
              <strong>{{ mod.label }}</strong>
              <small>{{ mod.description }}</small>
            </div>
          </div>
        </div>

        <div class="upload-row">
          <FileUpload
            mode="basic"
            :auto="false"
            :multiple="false"
            accept=".csv,.xlsx,.xls,.dat"
            chooseLabel="Datei auswählen"
            :maxFileSize="10000000"
            @select="onFileSelect"
          />
          <span v-if="selectedFile" class="filename">
            <i class="pi pi-file" />
            {{ selectedFile.name }}
          </span>
        </div>

        <Message v-if="parseError" severity="error" :closable="true" @close="parseError = ''">
          {{ parseError }}
        </Message>
      </template>

      <!-- Schritt 2: Rohdaten-Vorschau -->
      <template v-else-if="wizardStore.currentStep === 'preview'">
        <div class="content-header">
          <h3 class="content-title">Rohdaten-Vorschau</h3>
          <div class="preview-meta">
            <Tag :value="`${wizardStore.rawData?.totalRows} Zeilen`" severity="secondary" />
            <Tag :value="`${wizardStore.rawData?.columns.length} Spalten`" severity="secondary" />
            <span class="file-badge">
              <i class="pi pi-file" />
              {{ wizardStore.rawData?.fileName }}
            </span>
          </div>
        </div>

        <div class="preview-table-wrap">
          <DataTable
            :value="wizardStore.rawData?.rows ?? []"
            size="small"
            stripedRows
            tableStyle="width: max-content; min-width: 100%"
            class="preview-table"
          >
            <Column
              v-for="col in wizardStore.rawData?.columns ?? []"
              :key="col.index"
              :header="col.name"
              style="min-width: 120px"
            >
              <template #body="{ data }">{{ data[col.name] }}</template>
            </Column>
          </DataTable>
        </div>
      </template>

    </div>

    <!-- Footer: Navigation -->
    <div class="wizard-footer">
      <Button
        v-if="wizardStore.currentStepIndex > 0"
        label="Zurück"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        @click="goBack"
      />
      <span class="footer-spacer" />
      <Button
        v-if="wizardStore.currentStep !== 'send'"
        label="Weiter"
        icon="pi pi-arrow-right"
        iconPos="right"
        :disabled="!canGoNext"
        :loading="parsing"
        @click="goNext"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useWizardStore } from '@/stores/wizardStore'
import type { WizardStep } from '@/stores/wizardStore'
import { importModules } from '@/schemas'
import { parseRawFile } from '@/utils/rawParser'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload',  label: 'Datei & Modul' },
  { key: 'preview', label: 'Vorschau'      },
  { key: 'mapping', label: 'Spalten'       },
  { key: 'edit',    label: 'Prüfen'        },
  { key: 'send',    label: 'Senden'        },
]

const wizardStore = useWizardStore()

const selectedFile = ref<File | null>(null)
const parsing      = ref(false)
const parseError   = ref('')

function onFileSelect(event: { files: File[] }): void {
  selectedFile.value = event.files[0] ?? null
  parseError.value = ''
}

const canGoNext = computed((): boolean => {
  if (wizardStore.currentStep === 'upload') {
    return wizardStore.selectedModule !== null && selectedFile.value !== null
  }
  return wizardStore.canAdvance
})

async function goNext(): Promise<void> {
  if (wizardStore.currentStep === 'upload') {
    if (!selectedFile.value) return
    parsing.value = true
    parseError.value = ''
    try {
      const rawData = await parseRawFile(selectedFile.value)
      wizardStore.setRawData(rawData)
      wizardStore.advanceStep()
    } catch (e) {
      parseError.value = e instanceof Error ? e.message : 'Fehler beim Einlesen der Datei'
    } finally {
      parsing.value = false
    }
    return
  }
  wizardStore.advanceStep()
}

function goBack(): void {
  const prev = STEPS[wizardStore.currentStepIndex - 1]
  if (prev) wizardStore.goToStep(prev.key)
}
</script>

<style scoped>
.wizard-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── Schritt-Leiste ──────────────────────────────────────────────────────── */

.wizard-steps {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--p-surface-card);
  border-bottom: 1px solid var(--p-surface-border);
  flex-shrink: 0;
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: default;
  white-space: nowrap;
}

.wizard-step.is-clickable {
  cursor: pointer;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--p-surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-muted-color);
  background: var(--p-surface-card);
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}

.wizard-step.is-active .step-dot {
  border-color: var(--p-primary-color);
  background: var(--p-primary-color);
  color: #fff;
}

.wizard-step.is-done .step-dot {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
  color: var(--p-primary-color);
}

.step-label {
  font-size: 0.82rem;
  color: var(--p-text-muted-color);
  transition: color 0.2s;
}

.wizard-step.is-active .step-label {
  color: var(--p-primary-color);
  font-weight: 600;
}

.wizard-step.is-done .step-label {
  color: var(--p-text-color);
}

.step-connector {
  flex: 1;
  height: 2px;
  background: var(--p-surface-border);
  margin: 0 0.5rem;
  min-width: 1.5rem;
  transition: background 0.2s;
}

.step-connector.is-done {
  background: var(--p-primary-color);
}

/* ── Schritt-Inhalt ──────────────────────────────────────────────────────── */

.wizard-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-title {
  margin: 0;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.file-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: var(--p-text-muted-color);
}

.preview-table-wrap {
  overflow-x: auto;
  min-width: 0;
}

.preview-table-wrap :deep(.p-datatable-table-container) {
  overflow: visible !important;
}

/* Modul-Karten */

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  border: 2px solid var(--p-surface-border);
  border-radius: 8px;
  cursor: pointer;
  background: var(--p-surface-card);
  transition: border-color 0.15s, background 0.15s;
}

.module-card:hover {
  border-color: var(--p-primary-400);
}

.module-card.active {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

:global(.dark) .module-card.active {
  background: color-mix(in srgb, var(--p-primary-color) 15%, var(--p-surface-card));
}

.module-icon {
  font-size: 1.5rem;
  color: var(--p-primary-color);
  flex-shrink: 0;
}

.module-card strong {
  display: block;
  font-size: 0.95rem;
}

.module-card small {
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
}

/* Datei-Upload */

.upload-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filename {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

.wizard-footer {
  display: flex;
  align-items: center;
  padding: 0.875rem 2rem;
  border-top: 1px solid var(--p-surface-border);
  background: var(--p-surface-card);
  flex-shrink: 0;
}

.footer-spacer {
  flex: 1;
}
</style>
