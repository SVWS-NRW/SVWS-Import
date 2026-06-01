<template>
  <div class="table-view">
    <div class="table-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="router.push({ name: 'import' })"
          aria-label="Zurueck"
        />
        <h2>Schuljahresabschnitte</h2>
      </div>
      <div class="header-actions">
        <Button
          label="DB laden"
          icon="pi pi-refresh"
          severity="secondary"
          :loading="loading"
          @click="loadAbschnitte"
        />
      </div>
    </div>

    <Message v-if="successMessage" severity="success" :closable="true" @close="successMessage = ''">
      {{ successMessage }}
    </Message>

    <Message v-if="errorMessage" severity="error" :closable="true" @close="errorMessage = ''">
      {{ errorMessage }}
    </Message>

    <div class="content-grid">
      <section class="panel">
        <h3>Vorhandene Abschnitte</h3>
        <DataTable :value="sortedAbschnitte" stripedRows size="small" class="data-table">
          <Column field="id" header="ID" style="width: 90px" />
          <Column header="Schuljahr">
            <template #body="{ data }">
              {{ schuljahrLabel(data.schuljahr) }}
            </template>
          </Column>
          <Column field="abschnitt" header="Abschnitt" style="width: 120px">
            <template #body="{ data }">
              {{ data.abschnitt }}. Halbjahr
            </template>
          </Column>
          <Column header="Status" style="width: 140px">
            <template #body="{ data }">
              <Tag v-if="data.id === schuleStore.aktuellerAbschnittId" severity="success" value="Aktuell" />
              <Tag v-else severity="secondary" value="Vorhanden" />
            </template>
          </Column>
        </DataTable>
      </section>

      <section class="panel create-panel">
        <h3>Neuen Abschnitt anlegen</h3>
        <p class="panel-hint">Auch vergangene Schuljahre koennen manuell angelegt werden.</p>

        <div class="form-grid">
          <div class="field">
            <label for="schuljahr">Schuljahr (Startjahr)</label>
            <InputNumber
              id="schuljahr"
              v-model="newSchuljahr"
              :min="1900"
              :max="3000"
              :useGrouping="false"
              inputClass="w-full"
            />
            <small>{{ previewLabel }}</small>
          </div>

          <div class="field">
            <label for="abschnitt">Abschnitt</label>
            <Select
              id="abschnitt"
              v-model="newAbschnitt"
              :options="abschnittOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Abschnitt waehlen"
              class="w-full"
            />
          </div>
        </div>

        <Button
          label="Abschnitt anlegen"
          icon="pi pi-plus"
          :loading="creating"
          @click="handleCreate"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { useSchuleStore } from '@/stores/schule'
import { createSchuljahresabschnitt } from '@/services/svwsService'

const router = useRouter()
const schuleStore = useSchuleStore()

const loading = ref(false)
const creating = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const now = new Date()
const defaultSchuljahr = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
const newSchuljahr = ref<number | null>(defaultSchuljahr)
const newAbschnitt = ref<number>(1)

const abschnittOptions = [
  { label: '1. Halbjahr', value: 1 },
  { label: '2. Halbjahr', value: 2 },
]

const sortedAbschnitte = computed(() =>
  [...schuleStore.abschnitte].sort((a, b) =>
    a.schuljahr !== b.schuljahr ? b.schuljahr - a.schuljahr : b.abschnitt - a.abschnitt,
  ),
)

const previewLabel = computed(() => {
  if (newSchuljahr.value === null) return ''
  return `Anzeige: ${schuljahrLabel(newSchuljahr.value)} (${newAbschnitt.value}. Halbjahr)`
})

function schuljahrLabel(startJahr: number): string {
  return `${startJahr}/${String(startJahr + 1).slice(-2)}`
}

async function loadAbschnitte(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    await schuleStore.fetch()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Abschnitte konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

async function handleCreate(): Promise<void> {
  successMessage.value = ''
  errorMessage.value = ''

  const schuljahr = newSchuljahr.value
  if (schuljahr === null || schuljahr < 1900 || schuljahr > 3000) {
    errorMessage.value = 'Bitte ein gueltiges Schuljahr eingeben.'
    return
  }

  if (![1, 2].includes(newAbschnitt.value)) {
    errorMessage.value = 'Bitte einen gueltigen Abschnitt waehlen.'
    return
  }

  const exists = schuleStore.abschnitte.some(
    a => a.schuljahr === schuljahr && a.abschnitt === newAbschnitt.value,
  )
  if (exists) {
    errorMessage.value = 'Dieser Schuljahresabschnitt ist bereits vorhanden.'
    return
  }

  creating.value = true
  const result = await createSchuljahresabschnitt(schuljahr, newAbschnitt.value)
  creating.value = false

  if (!result.success) {
    errorMessage.value = result.error ?? 'Anlegen fehlgeschlagen.'
    return
  }

  await loadAbschnitte()
  successMessage.value = `Schuljahresabschnitt ${schuljahrLabel(schuljahr)} (${newAbschnitt.value}. Halbjahr) wurde angelegt.`
}

onMounted(async () => {
  await loadAbschnitte()
})
</script>

<style scoped>
.table-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.5rem;
}

.table-header {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(340px, 1.5fr) minmax(320px, 1fr);
  gap: 1rem;
}

.panel {
  border: 1px solid var(--p-surface-border);
  border-radius: 12px;
  background: var(--p-surface-card);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.panel h3 {
  margin: 0;
  font-size: 1rem;
}

.panel-hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.92rem;
}

.data-table :deep(thead th) {
  white-space: nowrap;
}

.form-grid {
  display: grid;
  gap: 0.9rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-weight: 600;
  font-size: 0.92rem;
}

.field small {
  color: var(--p-text-muted-color);
}

.w-full {
  width: 100%;
}

@media (max-width: 980px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
