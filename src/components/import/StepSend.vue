<template>
  <div class="step-send">

    <!-- ── Zusammenfassung ─────────────────────────────────────────────── -->
    <div class="summary-card">
      <div class="summary-row">
        <span class="summary-label">Modul</span>
        <span class="summary-value">
          <i :class="module.icon" style="margin-right: 0.35rem" />
          {{ module.label }}
        </span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Bereit</span>
        <span class="summary-value ready">{{ readyCount }} Datensätze</span>
      </div>
      <div v-if="wizardStore.errorCount > 0" class="summary-row">
        <span class="summary-label">Übersprungen</span>
        <span class="summary-value error">
          {{ wizardStore.errorCount }} nicht valide (werden nicht gesendet)
        </span>
      </div>
      <div v-if="authStore.baseUrl" class="summary-row">
        <span class="summary-label">Server</span>
        <span class="summary-value muted">
          {{ authStore.baseUrl }} &nbsp;/&nbsp; {{ authStore.schema }}
        </span>
      </div>
    </div>

    <!-- ── Kontextdaten (modulabhängig) ───────────────────────────────── -->
    <div v-if="module.entityType === 'schueler'" class="context-section">
      <div class="section-title">Kontextdaten</div>
      <div class="context-row">
        <label class="context-label">Schuljahresabschnitt-ID *</label>
        <InputNumber
          v-model="idSchuljahresabschnitt"
          :min="1"
          :disabled="uploading || isDone"
          style="width: 140px"
        />
        <small class="context-hint">
          Welchem Schuljahresabschnitt sollen die Schüler zugeordnet werden?
        </small>
      </div>
    </div>

    <!-- ── Fortschritt ─────────────────────────────────────────────────── -->
    <div v-if="hasSendStarted" class="progress-section">
      <div class="progress-header">
        <span class="progress-label">
          {{ sessionSentCount }} von {{ toSendCount }} übertragen
        </span>
        <span v-if="isDone" class="done-label">
          <i class="pi pi-check-circle" />
          Abgeschlossen
        </span>
      </div>
      <ProgressBar :value="progressPercent" style="height: 0.6rem" />

      <!-- Fehlgeschlagene Zeilen -->
      <div v-if="failedRows.length > 0" class="error-list">
        <div class="error-list-title">
          <i class="pi pi-times-circle" />
          {{ failedRows.length }} Zeile(n) fehlgeschlagen
        </div>
        <div
          v-for="row in failedRows"
          :key="row._id"
          class="error-item"
        >
          <span class="error-item-label">{{ rowLabel(row) }}</span>
          <span class="error-item-msg">{{ row._serverError }}</span>
        </div>
      </div>
    </div>

    <!-- ── Aktionen ───────────────────────────────────────────────────── -->
    <div class="send-actions">
      <template v-if="!isDone">
        <Button
          :label="`${readyCount} Datensätze an SVWS senden`"
          icon="pi pi-upload"
          :disabled="readyCount === 0 || uploading || !canSend"
          :loading="uploading"
          size="large"
          @click="sendAll"
        />
        <small v-if="!canSend && module.entityType === 'schueler'" class="action-hint error">
          Bitte Schuljahresabschnitt-ID angeben.
        </small>
        <small v-if="readyCount === 0" class="action-hint">
          Keine validen Datensätze zum Senden.
        </small>
      </template>

      <template v-else>
        <div class="done-summary">
          <Tag
            v-if="successCount > 0"
            :value="`✓ ${successCount} erfolgreich übertragen`"
            severity="success"
          />
          <Tag
            v-if="failedRows.length > 0"
            :value="`✖ ${failedRows.length} fehlgeschlagen`"
            severity="danger"
          />
        </div>
        <Button
          v-if="failedRows.length > 0"
          label="Fehlgeschlagene erneut senden"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="retryFailed"
        />
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { useWizardStore } from '@/stores/wizardStore'
import { useAuthStore } from '@/stores/auth'
import { sendMappedRow } from '@/services/svwsService'
import type { ImportModule, MappedRow } from '@/models/ImportSchema'

const props = defineProps<{ module: ImportModule }>()

const wizardStore = useWizardStore()
const authStore   = useAuthStore()

// ── Kontext ────────────────────────────────────────────────────────────────

const idSchuljahresabschnitt = computed({
  get: () => wizardStore.context.idSchuljahresabschnitt ?? 1,
  set: (v: number) => wizardStore.setContext({ idSchuljahresabschnitt: v }),
})

const canSend = computed(() => {
  if (props.module.entityType === 'schueler') {
    return (wizardStore.context.idSchuljahresabschnitt ?? 0) >= 1
  }
  return true
})

// ── Sendelogik ─────────────────────────────────────────────────────────────

const uploading        = ref(false)
const hasSendStarted   = ref(false)
const toSendCount      = ref(0)
const sessionSentCount = ref(0)

const readyCount = computed(() =>
  wizardStore.mappedRows.filter(r => r._valid && !r._sent).length
)

const failedRows = computed(() =>
  wizardStore.mappedRows.filter(r => !!r._serverError) as MappedRow[]
)

const successCount = computed(() =>
  wizardStore.mappedRows.filter(r => r._sent).length
)

const progressPercent = computed(() =>
  toSendCount.value > 0
    ? Math.round((sessionSentCount.value / toSendCount.value) * 100)
    : 0
)

const isDone = computed(() => hasSendStarted.value && !uploading.value)

async function sendAll() {
  const pending = wizardStore.mappedRows.filter(r => r._valid && !r._sent)
  if (pending.length === 0) return

  hasSendStarted.value   = true
  uploading.value        = true
  toSendCount.value      = pending.length
  sessionSentCount.value = 0

  for (const row of pending) {
    const result = await sendMappedRow(props.module, row, wizardStore.context)
    wizardStore.markSent(row._id, result.success ? undefined : result.error)
    sessionSentCount.value++
  }

  uploading.value = false
}

async function retryFailed() {
  const pending = failedRows.value.filter(r => !r._sent)
  if (pending.length === 0) return

  uploading.value        = true
  toSendCount.value      = pending.length
  sessionSentCount.value = 0

  // Fehler-Status zurücksetzen, damit markSent korrekt greift
  for (const row of pending) {
    wizardStore.updateRow(row._id, { _serverError: undefined })
  }

  for (const row of pending) {
    const result = await sendMappedRow(props.module, row, wizardStore.context)
    wizardStore.markSent(row._id, result.success ? undefined : result.error)
    sessionSentCount.value++
  }

  uploading.value = false
}

// ── Hilfsfunktionen ────────────────────────────────────────────────────────

function rowLabel(row: MappedRow): string {
  return props.module.fields
    .filter(f => f.required)
    .slice(0, 2)
    .map(f => String(row[f.key] ?? ''))
    .filter(Boolean)
    .join(' ') || row._id
}
</script>

<style scoped>
.step-send {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 680px;
}

/* ── Zusammenfassung ──────────────────────────────────────────────────────── */

.summary-card {
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  overflow: hidden;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.65rem 1.1rem;
  border-bottom: 1px solid var(--p-surface-border);
  font-size: 0.875rem;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  width: 120px;
  flex-shrink: 0;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
}

.summary-value { font-weight: 500; }
.summary-value.ready  { color: var(--p-green-500); }
.summary-value.error  { color: var(--p-red-500); }
.summary-value.muted  { color: var(--p-text-muted-color); font-weight: 400; font-size: 0.82rem; }

/* ── Kontext ──────────────────────────────────────────────────────────────── */

.context-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.context-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.context-label {
  font-size: 0.875rem;
  font-weight: 500;
  width: 180px;
  flex-shrink: 0;
}

.context-hint {
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
}

/* ── Fortschritt ──────────────────────────────────────────────────────────── */

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.progress-label { color: var(--p-text-muted-color); }

.done-label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--p-green-500);
  font-weight: 600;
}

.error-list {
  background: color-mix(in srgb, var(--p-red-500) 5%, var(--p-surface-card));
  border: 1px solid color-mix(in srgb, var(--p-red-500) 30%, var(--p-surface-border));
  border-radius: 6px;
  overflow: hidden;
}

.error-list-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--p-red-500);
  border-bottom: 1px solid color-mix(in srgb, var(--p-red-500) 20%, var(--p-surface-border));
}

.error-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.4rem 0.875rem;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--p-surface-border);
}

.error-item:last-child { border-bottom: none; }

.error-item-label {
  font-weight: 500;
  flex-shrink: 0;
  min-width: 120px;
}

.error-item-msg { color: var(--p-red-600); }

/* ── Aktionen ─────────────────────────────────────────────────────────────── */

.send-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.action-hint {
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
}

.action-hint.error { color: var(--p-red-500); }

.done-summary {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
