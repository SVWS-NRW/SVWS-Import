<template>
  <div class="column-card" :class="statusClass">
    <div class="card-header">
      <span class="status-dot" :class="statusClass" />
      <span class="col-name">{{ column.name }}</span>
      <span class="type-chip">{{ TYPE_LABELS[column.detectedType] ?? column.detectedType }}</span>
    </div>

    <div v-if="column.samples.length" class="card-samples">
      {{ column.samples.slice(0, 5).join(', ') }}
    </div>

    <div class="card-select-row">
      <Select
        :modelValue="assignment.targetFieldKey"
        :options="groupedOptions"
        optionGroupLabel="label"
        optionGroupChildren="items"
        optionLabel="label"
        optionValue="value"
        placeholder="— Nicht zuweisen —"
        showClear
        class="card-select"
        @update:modelValue="onSelect"
      />
      <Tag
        v-if="assignment.isSuggested && assignment.targetFieldKey !== null"
        value="Vorschlag"
        severity="warn"
        class="suggestion-tag"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import type { RawColumn } from '@/models/RawImportData'
import type { FieldDefinition } from '@/models/ImportSchema'
import type { ColumnAssignment } from '@/models/ColumnMapping'

const TYPE_LABELS: Record<string, string> = {
  text:   'Text',
  number: 'Zahl',
  date:   'Datum',
  mixed:  'Gemischt',
}

const props = defineProps<{
  column: RawColumn
  assignment: ColumnAssignment
  fields: FieldDefinition[]
}>()

const emit = defineEmits<{
  'update:assignment': [assignment: ColumnAssignment]
}>()

// Fields grouped by category for the Select dropdown
const groupedOptions = computed(() => {
  const groups = new Map<string, { label: string; value: string }[]>()
  for (const field of props.fields) {
    if (!groups.has(field.category)) groups.set(field.category, [])
    groups.get(field.category)!.push({
      label: field.required ? `${field.label} *` : field.label,
      value: field.key,
    })
  }
  return [...groups.entries()].map(([cat, items]) => ({ label: cat, items }))
})

const statusClass = computed(() => {
  if (props.assignment.isSuggested && props.assignment.targetFieldKey !== null) return 'is-suggested'
  if (props.assignment.targetFieldKey !== null) return 'is-assigned'
  return 'is-unassigned'
})

function onSelect(value: string | null | undefined) {
  emit('update:assignment', {
    ...props.assignment,
    targetFieldKey: value ?? null,
    isSuggested: false,
  })
}
</script>

<style scoped>
.column-card {
  padding: 0.35rem 0.625rem;
  border: 2px solid var(--p-surface-border);
  border-radius: 6px;
  background: var(--p-surface-card);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  transition: border-color 0.15s;
}

.column-card.is-assigned {
  border-color: var(--p-green-500);
}

.column-card.is-suggested {
  border-color: var(--p-yellow-500);
}

/* ── Header ─────────────────────────────────────────────────────────────── */

.card-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--p-surface-border);
  transition: background 0.15s;
}

.status-dot.is-assigned  { background: var(--p-green-500); }
.status-dot.is-suggested { background: var(--p-yellow-500); }

.col-name {
  font-weight: 600;
  font-size: 0.75rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-chip {
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  background: var(--p-surface-ground);
  color: var(--p-text-muted-color);
  border: 1px solid var(--p-surface-border);
  flex-shrink: 0;
}

/* ── Samples ─────────────────────────────────────────────────────────────── */

.card-samples {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Select row ──────────────────────────────────────────────────────────── */

.card-select-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.card-select {
  flex: 1;
}

.suggestion-tag {
  flex-shrink: 0;
}

:deep(.p-select .p-select-label) {
  font-size: 0.72rem;
  padding: 0.18rem 0.25rem;
}

:deep(.p-select .p-select-dropdown) {
  width: 1.25rem;
}

:deep(.p-select .p-select-dropdown .p-icon) {
  width: 0.6rem;
  height: 0.6rem;
}

:deep(.p-tag) {
  font-size: 0.62rem;
  padding: 0.1rem 0.25rem;
}
</style>
