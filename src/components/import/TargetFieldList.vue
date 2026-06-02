<template>
  <div class="target-list">
    <div class="target-header">
      <span class="target-title">Zielfelder</span>
      <span class="target-meta">{{ assignedCount }} / {{ fields.length }} zugewiesen</span>
    </div>

    <div v-for="[category, catFields] in categories" :key="category" class="target-category">
      <div class="category-label">{{ category }}</div>

      <div
        v-for="field in catFields"
        :key="field.key"
        class="target-field"
        :class="fieldClass(field)"
      >
        <span class="field-name">
          <span v-if="field.required" class="required-star">*</span>
          {{ field.label }}
          <span v-if="field.hint" class="field-hint" :title="field.hint">
            <i class="pi pi-info-circle" />
          </span>
        </span>

        <span class="field-source">
          <template v-if="assignmentMap.get(field.key)">
            <span class="source-badge">{{ assignmentMap.get(field.key) }}</span>
            <i
              v-if="suggestedMap.has(field.key)"
              class="pi pi-sparkles state-icon suggested"
            />
            <i v-else class="pi pi-check state-icon assigned" />
          </template>
          <span v-else class="dash">—</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FieldDefinition } from '@/models/ImportSchema'
import type { ColumnAssignment } from '@/models/ColumnMapping'

const props = defineProps<{
  fields: FieldDefinition[]
  assignments: ColumnAssignment[]
}>()

const categories = computed((): [string, FieldDefinition[]][] => {
  const map = new Map<string, FieldDefinition[]>()
  for (const field of props.fields) {
    if (!map.has(field.category)) map.set(field.category, [])
    map.get(field.category)!.push(field)
  }
  return [...map.entries()]
})

// targetFieldKey → sourceColumn
const assignmentMap = computed(() => {
  const m = new Map<string, string>()
  for (const a of props.assignments) {
    if (a.targetFieldKey !== null) m.set(a.targetFieldKey, a.sourceColumn)
  }
  return m
})

// targetFieldKey → true when still a suggestion
const suggestedMap = computed(() => {
  const m = new Map<string, true>()
  for (const a of props.assignments) {
    if (a.targetFieldKey !== null && a.isSuggested) m.set(a.targetFieldKey, true)
  }
  return m
})

const assignedCount = computed(
  () => props.fields.filter(f => assignmentMap.value.has(f.key)).length
)

function fieldClass(field: FieldDefinition) {
  const assigned  = assignmentMap.value.has(field.key)
  const suggested = suggestedMap.value.has(field.key)
  return {
    'is-missing':   field.required && !assigned,
    'is-suggested': assigned && suggested,
    'is-assigned':  assigned && !suggested,
  }
}
</script>

<style scoped>
.target-list {
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.65rem;
}

/* ── Header ─────────────────────────────────────────────────────────────── */

.target-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.5rem;
  background: var(--p-surface-section);
  border-bottom: 1px solid var(--p-surface-border);
}

.target-title {
  font-weight: 600;
  font-size: 0.68rem;
}

.target-meta {
  color: var(--p-text-muted-color);
  font-size: 0.62rem;
}

/* ── Category ────────────────────────────────────────────────────────────── */

.target-category {
  border-bottom: 1px solid var(--p-surface-border);
}

.target-category:last-child {
  border-bottom: none;
}

.category-label {
  padding: 0.15rem 0.5rem;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
  background: var(--p-surface-ground);
}

/* ── Field row ───────────────────────────────────────────────────────────── */

.target-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem 0.5rem;
  border-left: 3px solid transparent;
  gap: 0.35rem;
  min-height: 0;
  transition: border-color 0.15s, background 0.15s;
}

.target-field.is-missing {
  border-left-color: var(--p-red-500);
  background: color-mix(in srgb, var(--p-red-500) 5%, transparent);
}

.target-field.is-suggested {
  border-left-color: var(--p-yellow-500);
}

.target-field.is-assigned {
  border-left-color: var(--p-green-500);
}

.field-name {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.required-star {
  color: var(--p-red-500);
  font-weight: 700;
  flex-shrink: 0;
}

.field-hint {
  color: var(--p-text-muted-color);
  cursor: help;
  font-size: 0.72rem;
  flex-shrink: 0;
}

/* ── Source badge ────────────────────────────────────────────────────────── */

.field-source {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
  max-width: 50%;
}

.source-badge {
  font-size: 0.6rem;
  padding: 0.05rem 0.3rem;
  border-radius: 4px;
  background: var(--p-surface-ground);
  border: 1px solid var(--p-surface-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.state-icon {
  font-size: 0.6rem;
  flex-shrink: 0;
}

.state-icon.assigned  { color: var(--p-green-500); }
.state-icon.suggested { color: var(--p-yellow-500); }

.dash {
  color: var(--p-text-muted-color);
}
</style>
