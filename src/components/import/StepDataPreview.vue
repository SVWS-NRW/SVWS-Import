<template>
  <div class="step-preview">

    <!-- ── Stats-Leiste ─────────────────────────────────────────────────── -->
    <div class="preview-bar">
      <div class="stats">
        <span class="stat neutral">
          <i class="pi pi-table" />
          {{ wizardStore.totalCount }} Zeilen
        </span>
        <span class="stat-sep">·</span>
        <span class="stat" :class="wizardStore.errorCount > 0 ? 'error' : 'neutral'">
          <i class="pi pi-times-circle" />
          {{ wizardStore.errorCount }} Fehler
        </span>
        <span class="stat-sep">·</span>
        <span class="stat ready">
          <i class="pi pi-check-circle" />
          {{ wizardStore.readyCount }} bereit
        </span>
      </div>

      <div class="bar-actions">
        <Button
          :label="showOnlyErrors ? 'Alle Zeilen' : 'Nur Fehler'"
          :icon="showOnlyErrors ? 'pi pi-list' : 'pi pi-times-circle'"
          :severity="showOnlyErrors ? 'secondary' : 'danger'"
          size="small"
          outlined
          :disabled="wizardStore.errorCount === 0"
          @click="toggleErrorFilter"
        />
      </div>
    </div>

    <!-- ── Datentabelle ─────────────────────────────────────────────────── -->
    <ag-grid-vue
      :class="[isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz', 'data-grid']"
      :rowData="wizardStore.mappedRows"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :rowClassRules="rowClassRules"
      :getRowId="getRowId"
      :isExternalFilterPresent="isExternalFilterPresent"
      :doesExternalFilterPass="doesExternalFilterPass"
      :enableBrowserTooltips="true"
      :animateRows="true"
      :stopEditingWhenCellsLoseFocus="true"
      @cell-value-changed="onCellChanged"
      @grid-ready="onGridReady"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { AgGridVue } from '@ag-grid-community/vue3'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import {
  ModuleRegistry,
  type ColDef,
  type GetRowIdParams,
  type CellValueChangedEvent,
  type GridReadyEvent,
  type GridApi,
  type IRowNode,
} from '@ag-grid-community/core'
import Button from 'primevue/button'
import { useWizardStore } from '@/stores/wizardStore'
import { useDarkMode } from '@/composables/useDarkMode'
import type { ImportModule, MappedRow, FieldDefinition } from '@/models/ImportSchema'

ModuleRegistry.registerModules([ClientSideRowModelModule])

const props = defineProps<{ module: ImportModule }>()

const wizardStore = useWizardStore()
const { isDark }  = useDarkMode()
const gridApi     = ref<GridApi<MappedRow> | null>(null)
const showOnlyErrors = ref(false)

// ── Spaltendefinitionen ────────────────────────────────────────────────────

function fieldError(field: FieldDefinition, value: unknown): string | null {
  const v = String(value ?? '').trim()
  if (field.required && !v) return `${field.label}: Pflichtfeld fehlt`
  if (field.validate && v) return field.validate(v)
  return null
}

function colWidth(field: FieldDefinition): Partial<ColDef> {
  if (field.type === 'date')   return { width: 140 }
  if (field.type === 'enum')   return { width: 120 }
  if (field.type === 'number') return { width: 100 }
  return { flex: 1 }
}

const columnDefs: ColDef<MappedRow>[] = [
  ...props.module.fields.map((field): ColDef<MappedRow> => ({
    field: field.key,
    headerName: field.required ? `${field.label} *` : field.label,
    editable: true,
    minWidth: 90,
    ...colWidth(field),
    cellStyle: params => {
      const err = fieldError(field, params.value)
      return err ? { background: '#fee2e2', color: '#991b1b' } : null
    },
    tooltipValueGetter: params => fieldError(field, params.value) ?? undefined,
  })),

  // Status-Spalte (rechts gepinnt)
  {
    headerName: 'Status',
    width: 110,
    editable: false,
    sortable: false,
    filter: false,
    pinned: 'right' as const,
    cellRenderer: (params: { data: MappedRow }) => {
      if (!params.data._valid) {
        const tip = (params.data._errors as string[]).join('; ').replace(/"/g, '&quot;')
        return `<span style="color:#ef4444" title="${tip}">✖ Fehler</span>`
      }
      return '<span style="color:#f59e0b">● Bereit</span>'
    },
  },

  // Löschen-Spalte (rechts gepinnt)
  {
    headerName: '',
    width: 48,
    editable: false,
    sortable: false,
    filter: false,
    pinned: 'right' as const,
    cellRenderer: (params: { data: MappedRow }) =>
      `<button onclick="window.__wizardDeleteRow('${params.data._id}')"
         style="border:none;background:none;cursor:pointer;color:#ef4444;font-size:1rem"
         title="Zeile löschen">✕</button>`,
  },
]

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
}

const rowClassRules = {
  'row-error': (params: { data: MappedRow }) => !params.data._valid,
}

function getRowId(params: GetRowIdParams<MappedRow>): string {
  return params.data._id
}

// ── Grid-Callbacks ─────────────────────────────────────────────────────────

function onGridReady(event: GridReadyEvent<MappedRow>) {
  gridApi.value = event.api
}

function isExternalFilterPresent(): boolean {
  return showOnlyErrors.value
}

function doesExternalFilterPass(node: IRowNode<MappedRow>): boolean {
  return node.data ? !node.data._valid : true
}

watch(showOnlyErrors, () => {
  gridApi.value?.onFilterChanged()
})

function toggleErrorFilter() {
  showOnlyErrors.value = !showOnlyErrors.value
}

// ── Zell-Bearbeitung & Re-Validierung ──────────────────────────────────────

function onCellChanged(event: CellValueChangedEvent<MappedRow>): void {
  if (!event.data || !event.colDef.field) return

  const updated = { ...event.data, [event.colDef.field]: event.newValue }
  const errors: string[] = []

  for (const field of props.module.fields) {
    const err = fieldError(field, updated[field.key])
    if (err) errors.push(err)
  }

  wizardStore.updateRow(event.data._id, {
    [event.colDef.field]: event.newValue,
    _valid: errors.length === 0,
    _errors: errors,
  })
}

// ── Zeile löschen via globalem Handler ────────────────────────────────────

;(window as unknown as Record<string, unknown>).__wizardDeleteRow = (id: string) => {
  wizardStore.deleteRow(id)
}

onUnmounted(() => {
  delete (window as unknown as Record<string, unknown>).__wizardDeleteRow
})
</script>

<style scoped>
.step-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

/* ── Stats-Leiste ─────────────────────────────────────────────────────────── */

.preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
}

.stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 500;
}

.stat.neutral { color: var(--p-text-muted-color); }
.stat.error   { color: var(--p-red-500); }
.stat.ready   { color: var(--p-green-500); }

.stat-sep {
  color: var(--p-surface-border);
  font-size: 1rem;
}

.bar-actions {
  flex-shrink: 0;
}

/* ── Datentabelle ─────────────────────────────────────────────────────────── */

.data-grid {
  flex: 1;
  min-height: 0;
}
</style>

<!-- Globale AG-Grid-Klassen müssen non-scoped sein -->
<style>
.ag-theme-quartz      .row-error { background-color: #fff5f5 !important; }
.ag-theme-quartz-dark .row-error { background-color: rgba(239,68,68,0.08) !important; }

.ag-theme-quartz-dark .cell-has-error {
  background-color: rgba(239, 68, 68, 0.2) !important;
  color: #fca5a5 !important;
}
</style>
