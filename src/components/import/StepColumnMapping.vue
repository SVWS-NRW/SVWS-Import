<template>
  <div class="step-mapping">

    <!-- Header: Titel + Aktionen -->
    <div class="mapping-header">
      <div class="header-left">
        <h3 class="mapping-title">Spalten zuordnen</h3>
        <Tag
          :value="`${assignedCount} / ${fields.length} Felder zugewiesen`"
          :severity="allRequiredMapped ? 'success' : 'warn'"
        />
      </div>
      <div class="header-actions">
        <Button
          v-if="hasSuggestions"
          label="Alle Vorschläge übernehmen"
          icon="pi pi-check-circle"
          severity="secondary"
          outlined
          size="small"
          @click="acceptAllSuggestions"
        />
        <Button
          label="Zurücksetzen"
          icon="pi pi-refresh"
          severity="secondary"
          text
          size="small"
          @click="resetMapping"
        />
      </div>
    </div>

    <!-- Zwei-Spalten-Layout: Quellspalten links, Zielfelder rechts (sticky) -->
    <div class="mapping-layout">
      <div class="column-list">
        <ColumnCard
          v-for="(assignment, idx) in assignments"
          :key="assignment.sourceColumn"
          :column="rawColumns[idx]"
          :assignment="assignment"
          :fields="fields"
          @update:assignment="a => updateAssignment(idx, a)"
        />
      </div>

      <div class="target-panel">
        <TargetFieldList :fields="fields" :assignments="assignments" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ColumnCard from './ColumnCard.vue'
import TargetFieldList from './TargetFieldList.vue'
import { useColumnMatcher } from '@/composables/useColumnMatcher'
import type { RawColumn } from '@/models/RawImportData'
import type { FieldDefinition } from '@/models/ImportSchema'
import type { ColumnAssignment, ColumnMapping } from '@/models/ColumnMapping'

const props = defineProps<{
  moduleId: string
  rawColumns: RawColumn[]
  fields: FieldDefinition[]
  /** Bestehendes Mapping aus dem Store (z. B. beim Zurücknavigieren) */
  initialMapping: ColumnMapping | null
}>()

const emit = defineEmits<{
  'update:mapping': [mapping: ColumnMapping]
}>()

const { buildSuggestion } = useColumnMatcher()

const assignments = ref<ColumnAssignment[]>([])

onMounted(() => {
  if (props.initialMapping) {
    assignments.value = [...props.initialMapping.assignments]
  } else {
    runAutoMatch()
  }
})

function runAutoMatch() {
  const mapping = buildSuggestion(props.rawColumns, props.fields, props.moduleId)
  assignments.value = mapping.assignments
  emitCurrent()
}

function emitCurrent() {
  emit('update:mapping', { moduleId: props.moduleId, assignments: assignments.value })
}

function updateAssignment(index: number, a: ColumnAssignment) {
  assignments.value[index] = a
  emitCurrent()
}

function acceptAllSuggestions() {
  assignments.value = assignments.value.map(a => ({ ...a, isSuggested: false }))
  emitCurrent()
}

function resetMapping() {
  runAutoMatch()
}

const hasSuggestions = computed(() =>
  assignments.value.some(a => a.isSuggested && a.targetFieldKey !== null)
)

const assignedCount = computed(() =>
  assignments.value.filter(a => a.targetFieldKey !== null).length
)

const allRequiredMapped = computed(() => {
  const keys = new Set(
    assignments.value
      .filter(a => a.targetFieldKey !== null)
      .map(a => a.targetFieldKey as string),
  )
  return props.fields.filter(f => f.required).every(f => keys.has(f.key))
})
</script>

<style scoped>
.step-mapping {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ─────────────────────────────────────────────────────────────── */

.mapping-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.mapping-title {
  margin: 0;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Two-column layout ───────────────────────────────────────────────────── */

.mapping-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 900px) {
  .mapping-layout {
    grid-template-columns: 1fr;
  }
  .target-panel {
    position: static !important;
  }
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Klebt am oberen Rand, während die Quellspalten durchgescrollt werden */
.target-panel {
  position: sticky;
  top: 0;
}
</style>
