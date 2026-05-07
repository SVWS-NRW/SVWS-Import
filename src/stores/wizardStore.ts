import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ImportModule, MappedRow, ImportContext } from '@/models/ImportSchema'
import type { ColumnMapping } from '@/models/ColumnMapping'
import type { RawImportData } from '@/models/RawImportData'

export type WizardStep = 'upload' | 'preview' | 'mapping' | 'edit' | 'send'

const STEP_ORDER: WizardStep[] = ['upload', 'preview', 'mapping', 'edit', 'send']

export const useWizardStore = defineStore('wizard', () => {
  const currentStep    = ref<WizardStep>('upload')
  const selectedModule = ref<ImportModule | null>(null)
  const rawData        = ref<RawImportData | null>(null)
  const columnMapping  = ref<ColumnMapping | null>(null)
  const mappedRows     = ref<MappedRow[]>([])
  const context        = ref<ImportContext>({})
  const uploading      = ref(false)
  const completedSteps = ref<Set<WizardStep>>(new Set())

  // ── Computed ───────────────────────────────────────────────────────────────

  const currentStepIndex = computed(() => STEP_ORDER.indexOf(currentStep.value))

  /** Sind alle Pflichtfelder des Moduls in der aktuellen Mapping-Konfiguration zugewiesen? */
  const hasRequiredFieldsMapped = computed((): boolean => {
    if (!selectedModule.value || !columnMapping.value) return false
    const assignedKeys = new Set(
      columnMapping.value.assignments
        .filter(a => a.targetFieldKey !== null)
        .map(a => a.targetFieldKey as string),
    )
    return selectedModule.value.fields
      .filter(f => f.required)
      .every(f => assignedKeys.has(f.key))
  })

  /** Darf der aktuelle Schritt vorwärts navigiert werden? */
  const canAdvance = computed((): boolean => {
    switch (currentStep.value) {
      case 'upload':  return rawData.value !== null && selectedModule.value !== null
      case 'preview': return rawData.value !== null
      case 'mapping': return columnMapping.value !== null && hasRequiredFieldsMapped.value
      case 'edit':    return mappedRows.value.length > 0
      default:        return false
    }
  })

  const totalCount = computed(() => mappedRows.value.length)
  const errorCount = computed(() => mappedRows.value.filter(r => !r._valid).length)
  const sentCount  = computed(() => mappedRows.value.filter(r => r._sent).length)
  const readyCount = computed(() => mappedRows.value.filter(r => r._valid && !r._sent).length)

  // ── Navigation ─────────────────────────────────────────────────────────────

  function advanceStep(): void {
    const idx = currentStepIndex.value
    if (idx < STEP_ORDER.length - 1 && canAdvance.value) {
      completedSteps.value.add(currentStep.value)
      currentStep.value = STEP_ORDER[idx + 1]
    }
  }

  function goToStep(step: WizardStep): void {
    const targetIdx  = STEP_ORDER.indexOf(step)
    const currentIdx = currentStepIndex.value
    // Rückwärts immer erlaubt; vorwärts nur zu bereits abgeschlossenen Schritten
    if (targetIdx <= currentIdx || completedSteps.value.has(step)) {
      currentStep.value = step
    }
  }

  // ── Setter ─────────────────────────────────────────────────────────────────

  function setModule(module: ImportModule): void {
    selectedModule.value = module
    // Mapping zurücksetzen, wenn das Modul wechselt
    columnMapping.value = null
    mappedRows.value = []
  }

  function setRawData(data: RawImportData): void {
    rawData.value = data
  }

  function setColumnMapping(mapping: ColumnMapping): void {
    columnMapping.value = mapping
  }

  function setMappedRows(rows: MappedRow[]): void {
    mappedRows.value = rows
  }

  function setContext(ctx: ImportContext): void {
    context.value = { ...context.value, ...ctx }
  }

  // ── Zeilenbearbeitung ──────────────────────────────────────────────────────

  function updateRow(id: string, patch: Partial<MappedRow>): void {
    const idx = mappedRows.value.findIndex(r => r._id === id)
    if (idx !== -1) {
      mappedRows.value[idx] = { ...mappedRows.value[idx], ...patch }
    }
  }

  function deleteRow(id: string): void {
    mappedRows.value = mappedRows.value.filter(r => r._id !== id)
  }

  function markSent(id: string, serverError?: string): void {
    const idx = mappedRows.value.findIndex(r => r._id === id)
    if (idx !== -1) {
      mappedRows.value[idx] = {
        ...mappedRows.value[idx],
        _sent: !serverError,
        _serverError: serverError,
        _errors: serverError ? [serverError] : [],
      }
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset(): void {
    currentStep.value    = 'upload'
    selectedModule.value = null
    rawData.value        = null
    columnMapping.value  = null
    mappedRows.value     = []
    context.value        = {}
    uploading.value      = false
    completedSteps.value = new Set()
  }

  return {
    // State
    currentStep, selectedModule, rawData, columnMapping,
    mappedRows, context, uploading, completedSteps,
    // Computed
    currentStepIndex, hasRequiredFieldsMapped, canAdvance,
    totalCount, errorCount, sentCount, readyCount,
    // Navigation
    advanceStep, goToStep,
    // Setter
    setModule, setRawData, setColumnMapping, setMappedRows, setContext,
    // Zeilenbearbeitung
    updateRow, deleteRow, markSent,
    // Reset
    reset,
  }
})
